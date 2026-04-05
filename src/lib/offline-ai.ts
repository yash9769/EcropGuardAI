import * as ort from 'onnxruntime-web';
import { type DiagnosisResult } from './gemini';
import { getMetadata } from './crop-metadata';

// --- ONNX Runtime WASM Paths (For Mobile/Capacitor) ---
// Fallback to CDN for web rendering to avoid Vite intercepting public .mjs files
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
ort.env.wasm.numThreads = 1; // More stable on mobile

// --- Labels for each model (SYNCED WITH TRAINING/TESTING RESULTS) ---
const LABELS_RESNET50 = [
  "Healthy", "Wilt", "Blight", "Leaf Spot"
];

const LABELS_BLACKGRAM = [
  "Healthy", "Anthracnose", "Cercospora", "Powdery Mildew", "Yellow Mosaic Virus", "Unknown/Background"
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
    let sum = 0, sqSum = 0, colorDiffSum = 0;
    let greenAdvantage = 0; // Cumulative Green richness
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
      
      // Greenness: In leaves, Green is usually the dominant channel
      if (g > r + 10 && g > b + 10) greenAdvantage++;
    }
    const meanVal = sum / len;
    const variance = (sqSum / len) - (meanVal * meanVal);
    const avgColorDiff = colorDiffSum / len;
    const greenRatio = greenAdvantage / len;

    // 7. Find top 2 confidences for Margin analysis
    let maxIdx = 0;
    let secondMaxVal = -Infinity;
    let maxVal = -Infinity;
    let minVal = Infinity;
    
    for (let i = 0; i < output.length; i++) {
        if (output[i] > maxVal) {
            secondMaxVal = maxVal;
            maxVal = output[i];
            maxIdx = i;
        } else if (output[i] > secondMaxVal) {
            secondMaxVal = output[i];
        }
        if (output[i] < minVal) {
            minVal = output[i];
        }
    }

    const logitGap = maxVal - minVal;
    const margin = maxVal - secondMaxVal;

    // Softmax for real confidence score
    const expSum = Array.from(output).reduce((acc, val) => acc + Math.exp(val), 0);
    const confidence = Math.round((Math.exp(output[maxIdx]) / expSum) * 100);

    const diseaseName = labels[maxIdx] || `Class ${maxIdx}`;
    
    // 8. Advanced Noise Rejection
    let isLikelyNoise = false;
    
    // LOGIC: 
    // 1. Saturation Check: Real leaves are colorful. Diagrams/Backgrounds are gray-ish.
    if (avgColorDiff < 7.0) isLikelyNoise = true; 
    
    // 2. Variance Check: Solid walls (low var) or High-contrast text (excessive var)
    if (variance < 25 || variance > 8500) isLikelyNoise = true;
    
    // 3. Greenness Check: Foliage detection
    //    A real healthy or mildly diseased leaf should have a significant green presence.
    //    Extremely low greenRatio (<5%) is usually a non-plant object.
    if (greenRatio < 0.05) isLikelyNoise = true;

    // 4. Model Confidence & Stability (Logit Margin)
    if (cropType !== 'blackgram') {
      // resnet50 (chickpea)
      // If the top prediction is not dominant enough, it's likely noise the model is "guessing" on.
      if (maxVal < 3.0 || margin < 1.0 || confidence < 60) isLikelyNoise = true;
    } else {
      // blackgram
      if (confidence < 45 || diseaseName.includes('Background') || margin < 0.8) isLikelyNoise = true;
    }

    if (isLikelyNoise) {
      console.log(`[Noise Rejected] Saturation: ${avgColorDiff.toFixed(2)}, GreenRatio: ${greenRatio.toFixed(2)}, Variance: ${variance.toFixed(2)}, MaxLogit: ${maxVal.toFixed(2)}, Margin: ${margin.toFixed(2)}`);
      return {
        diseaseName: 'No Crop Detected',
        cropType: cropType === 'blackgram' ? 'Blackgram' : 'Chickpea',
        confidence: 0,
        severity: 'low',
        description: cropType !== 'blackgram'
          ? 'No clear chickpea leaf detected. This model identifies Wilt, Blight, and Leaf Spot on chickpea plants.'
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
