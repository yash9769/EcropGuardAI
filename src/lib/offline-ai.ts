import * as ort from 'onnxruntime-web';
import { type DiagnosisResult } from './gemini';
import { getMetadata } from './crop-metadata';

// --- ONNX Runtime WASM Paths (For Mobile/Capacitor) ---
// Fallback to CDN for web rendering to avoid Vite intercepting public .mjs files
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
ort.env.wasm.numThreads = 1; // More stable on mobile

// --- Labels for each model (UPDATE THESE BASED ON YOUR TRAINING CLASSES) ---
const LABELS_RESNET50 = [
  "Blight", "Healthy", "Leaf Spot", "Wilt"
];

const LABELS_BLACKGRAM = [
  "Anthracnose", "Cercospora", "Healthy", "Powdery Mildew", "Yellow Mosaic Virus"
];

// Cache for ONNX sessions to avoid reloading on every scan
const sessionCache: Record<string, ort.InferenceSession> = {};

async function getSession(path: string): Promise<ort.InferenceSession> {
  if (sessionCache[path]) return sessionCache[path];
  console.log(`[eCropGuard] Initializing session for: ${path}`);
  const session = await ort.InferenceSession.create(path);
  sessionCache[path] = session;
  return session;
}

// Preprocessing: Maximize canvas performance
async function preprocess(imageData: ImageData): Promise<Float32Array> {
  const { data } = imageData;
  const floatData = new Float32Array(3 * 224 * 224);

  // Mean and Std for ImageNet (Common for ResNet)
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let i = 0; i < 224 * 224; i++) {
    // RGBA to planar RGB and Normalize
    floatData[i] = (data[i * 4] / 255 - mean[0]) / std[0]; // R
    floatData[i + 224 * 224] = (data[i * 4 + 1] / 255 - mean[1]) / std[1]; // G
    floatData[i + 2 * 224 * 224] = (data[i * 4 + 2] / 255 - mean[2]) / std[2]; // B
  }

  return floatData;
}

export async function analyzeOffline(
  dataUrl: string, 
  cropType: string = 'general'
): Promise<DiagnosisResult> {
  try {
    // 1. Choose model path
    const modelPath = cropType === 'blackgram' ? 'models/blackgram.onnx' : 'models/resnet50.onnx';
    const labels = cropType === 'blackgram' ? LABELS_BLACKGRAM : LABELS_RESNET50;

    // 2. Load/Get model session (CACHED)
    const session = await getSession(modelPath);

    // 3. Load and Resize image using Canvas
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");
    
    ctx.drawImage(img, 0, 0, 224, 224);
    const imageData = ctx.getImageData(0, 0, 224, 224);

    // 4. Preprocess
    const preprocessedData = await preprocess(imageData);
    const tensor = new ort.Tensor('float32', preprocessedData, [1, 3, 224, 224]);

    // 5. Run inference
    const feeds = { input: tensor };
    const results = await session.run(feeds);
    const output = results.output.data as Float32Array;

    // 6. Calculate Pixel Stats for Noise Rejection
    // Real plant images have significant variance and color Saturation.
    let sum = 0, sqSum = 0, colorDiffSum = 0;
    const pData = imageData.data;
    const len = pData.length / 4;
    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      const r = pData[idx];
      const g = pData[idx + 1];
      const b = pData[idx + 2];
      const avg = (r + g + b) / 3;
      sum += avg;
      sqSum += avg * avg;
      // Absolute difference between channels (Saturation indicator)
      colorDiffSum += (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)) / 3;
    }
    const meanVal = sum / len;
    const variance = (sqSum / len) - (meanVal * meanVal);
    const avgColorDiff = colorDiffSum / len;

    // 7. Find max confidence
    let maxIdx = 0;
    let maxVal = -Infinity;
    let minVal = Infinity;
    for (let i = 0; i < output.length; i++) {
        if (output[i] > maxVal) {
            maxVal = output[i];
            maxIdx = i;
        }
        if (output[i] < minVal) {
            minVal = output[i];
        }
    }

    const logitGap = maxVal - minVal;

    // Softmax for real confidence score
    const expSum = Array.from(output).reduce((acc, val) => acc + Math.exp(val), 0);
    const confidence = Math.round((Math.exp(output[maxIdx]) / expSum) * 100);

    const diseaseName = labels[maxIdx] || `Class ${maxIdx}`;
    
    // 8. Advanced Noise Rejection
    let isLikelyNoise = false;
    
    // LOGIC: 
    // 1. Grayscale/Diagram Check: Real leaves are saturated. Diagrams are mostly gray/white/tan.
    //    We increase threshold to 6.0 for better rejection of "near-gray" documents.
    if (avgColorDiff < 6.0) isLikelyNoise = true; 
    
    // 2. Variance Check: 
    //    Solid colors (walls) -> variance < 20
    //    Technical diagrams (high contrast text/lines) -> variance > 8000
    if (variance < 20 || variance > 8000) isLikelyNoise = true;
    
    // 3. Logit Sensitivity:
    //    If the model is guessing on noise, logits are usually compressed.
    if (cropType !== 'blackgram') {
      // resnet50 thresholds (chickpea) — STIFFENED for higher reliability
      if (maxVal < 3.5 || logitGap < 5.0 || confidence < 60) isLikelyNoise = true;
    } else {
      // blackgram model
      if (confidence < 45 || diseaseName === 'Unknown/Background') isLikelyNoise = true;
    }

    if (isLikelyNoise) {
      console.log(`[Noise Rejected] Saturation: ${avgColorDiff.toFixed(2)}, Variance: ${variance.toFixed(2)}, MaxLogit: ${maxVal.toFixed(2)}, Gap: ${logitGap.toFixed(2)}`);
      return {
        diseaseName: 'No Crop Detected',
        cropType: 'Unknown',
        confidence: isLikelyNoise ? 0 : confidence, // Force 0 if rejected
        severity: 'low',
        description: cropType !== 'blackgram'
          ? 'No clear chickpea leaf detected. This model identifies Wilt, Leaf Spot, and Blight on chickpea plants.'
          : 'No blackgram leaf detected. Ensure you are scanning a blackgram leaf in clear, natural light.',
        symptoms: [],
        causes: [],
        recommendations: [
          'Capture a clear, focused photo of a single leaf',
          'Ensure the leaf fills at least 50% of the camera frame',
          'Avoid scanning text, diagrams, or random objects',
          'Hold the leaf against a neutral ground (soil or palm)'
         ],
        treatmentSteps: [],
        preventionTips: [],
        isHealthy: false,
        isLowConfidence: true
      };
    }

    const meta = getMetadata(diseaseName);
    const isHealthy = diseaseName.toLowerCase().includes('healthy');

    return {
      ...meta,
      diseaseName,
      cropType: cropType === 'blackgram' ? "Blackgram" : "Chickpea",
      confidence,
      isHealthy,
      isLowConfidence: cropType === 'blackgram' ? confidence < 50 : confidence < 65
    };
  } catch (error) {
    console.error("Offline analysis failed:", error);
    throw new Error(`Offline model failed: ${error instanceof Error ? error.message : "Unknown error"}. Check if /models/ folder exists.`);
  }
}
