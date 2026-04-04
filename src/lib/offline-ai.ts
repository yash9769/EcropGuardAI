import * as ort from 'onnxruntime-web';
import { type DiagnosisResult } from './gemini';

// --- ONNX Runtime WASM Paths (For Mobile/Capacitor) ---
// Fallback to CDN for web rendering to avoid Vite intercepting public .mjs files
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
ort.env.wasm.numThreads = 1; // More stable on mobile

// --- Labels for each model (UPDATE THESE BASED ON YOUR TRAINING CLASSES) ---
const LABELS_RESNET50 = [
  "Healthy", "Early Blight", "Late Blight", "Rust", "Unknown Disease"
];

const LABELS_BLACKGRAM = [
  "Unknown/Background", "Anthracnose", "Healthy", "Leaf Crinckle", "Powdery Mildew", "Yellow Mosaic"
];

// Preprocessing: Maximize canvas performance
async function preprocess(imageData: ImageData): Promise<Float32Array> {
  const { data, width, height } = imageData;
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

    console.log(`Loading model: ${modelPath}`);
    // 2. Load model
    const session = await ort.InferenceSession.create(modelPath);
    console.log("Model loaded successfully");

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

    // 6. Find max confidence
    let maxIdx = 0;
    let maxVal = -Infinity;
    for (let i = 0; i < output.length; i++) {
      if (output[i] > maxVal) {
        maxVal = output[i];
        maxIdx = i;
      }
    }

    // Softmax for real confidence score (optional)
    const expSum = Array.from(output).reduce((acc, val) => acc + Math.exp(val), 0);
    const confidence = Math.round((Math.exp(output[maxIdx]) / expSum) * 100);

    const diseaseName = labels[maxIdx] || `Disease Class ${maxIdx}`;
    
    // Noise rejection (borrowed from native-onnx logic)
    const minVal = Math.min(...Array.from(output));
    const logitGap = maxVal - minVal;
    
    let isLikelyNoise = false;
    if (cropType !== 'blackgram') {
      isLikelyNoise = maxVal < 2.5 || logitGap < 5.0;
    } else {
      isLikelyNoise = confidence < 35 || diseaseName === 'Unknown/Background';
    }

    if (isLikelyNoise) {
      return {
        diseaseName: 'No Crop Detected',
        cropType: 'Unknown',
        confidence: confidence,
        severity: 'low',
        description: cropType !== 'blackgram'
          ? 'No supported crop leaf detected. This model recognises tomato/potato disease classes. Point the camera directly at a leaf.'
          : 'No blackgram leaf detected. Ensure you are scanning a blackgram leaf in clear, bright light.',
        symptoms: [],
        causes: [],
        recommendations: [
          'Hold the phone 15–30 cm from the leaf',
          'Fill the frame entirely with the leaf',
          'Use bright natural light — avoid shadow or glare',
         ],
        treatmentSteps: [],
        preventionTips: [],
        isHealthy: false,
        isLowConfidence: true
      };
    }

    const isHealthy = diseaseName.toLowerCase().includes('healthy');

    // Return dummy populated structure since the model only gives binary/class
    return {
      diseaseName,
      cropType: cropType === 'blackgram' ? "Blackgram" : "General Crop",
      confidence,
      severity: isHealthy ? 'low' : (confidence > 80 ? 'high' : 'medium'),
      description: isHealthy ? "The crop appears to be in good health." : `Detected signs of ${diseaseName}.`,
      symptoms: isHealthy ? [] : ["Visible spots or discoloration on leaves"],
      causes: isHealthy ? [] : ["Environmental factors or pathogen transmission"],
      recommendations: isHealthy ? ["Continue regular watering and monitoring"] : ["Check soil moisture", "Remove infected leaves"],
      treatmentSteps: isHealthy ? [] : ["Isolate infected plants", "Consider organic fungicide if symptoms persist"],
      preventionTips: ["Ensure proper drainage", "Use nutrient-rich soil"],
      isHealthy
    };
  } catch (error) {
    console.error("Offline analysis failed:", error);
    throw new Error(`Offline model failed: ${error instanceof Error ? error.message : "Unknown error"}. Check if /models/ folder exists.`);
  }
}
