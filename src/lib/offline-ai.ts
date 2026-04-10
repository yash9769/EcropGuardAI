import * as ort from 'onnxruntime-web';
import { type DiagnosisResult } from './gemini';
import { getMetadata } from './crop-metadata';

// --- ONNX Runtime WASM Paths (For Mobile/Capacitor) ---
// Fallback to CDN for web rendering to avoid Vite intercepting public .mjs files
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
ort.env.wasm.numThreads = 1; // More stable on mobile

// --- Labels for each model (SYNCED WITH TRAINING/TESTING RESULTS) ---
// ORDER: Alphabetical (Standard for PyTorch ImageFolder)
const LABELS_RESNET50 = [
  "Blight", "Healthy", "Leaf Spot", "Wilt"
];

const LABELS_BLACKGRAM = [
  "Anthracnose", "Cercospora", "Healthy", "Powdery Mildew", "Yellow Mosaic Virus"
];

// Cache for ONNX session promises to prevent race conditions during concurrent loads
const sessionPromises: Record<string, Promise<ort.InferenceSession>> = {};

async function getSession(path: string): Promise<ort.InferenceSession> {
  const fullPath = path.startsWith('http') ? path : `${window.location.origin}${path}`;
  
  if (sessionPromises[fullPath]) return sessionPromises[fullPath];
  
  console.log(`[AgriSense] Initializing session: ${fullPath}`);
  
  sessionPromises[fullPath] = ort.InferenceSession.create(fullPath).catch(err => {
    delete sessionPromises[fullPath]; // Allow retry on failure
    console.error(`[AgriSense] Session initialization failed for ${fullPath}:`, err);
    throw err;
  });

  return sessionPromises[fullPath];
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

/**
 * Runs a single model and returns its diagnosis and confidence
 */
async function runSingleInference(
  session: ort.InferenceSession,
  labels: string[],
  tensor: ort.Tensor,
  cropType: 'Blackgram' | 'Chickpea'
) {
  const feeds = { [session.inputNames[0]]: tensor };
  const results = await session.run(feeds);
  const output = results[session.outputNames[0]].data as Float32Array;

  let maxIdx = 0;
  let maxVal = -Infinity;
  let secondMaxVal = -Infinity;
  let minVal = Infinity;

  for (let i = 0; i < output.length; i++) {
    if (output[i] > maxVal) {
      secondMaxVal = maxVal;
      maxVal = output[i];
      maxIdx = i;
    } else if (output[i] > secondMaxVal) {
      secondMaxVal = output[i];
    }
    if (output[i] < minVal) minVal = output[i];
  }

  const logitGap = maxVal - minVal;
  const margin = maxVal - secondMaxVal;

  // Softmax for real confidence score for all classes
  const expSum = Array.from(output).reduce((acc, val) => acc + Math.exp(val), 0);
  
  // Calculate Probabilistic Top 3 (PGM Concept)
  const probabilities = Array.from(output).map((val, idx) => ({
    label: labels[idx] || `Class ${idx}`,
    probability: Math.round((Math.exp(val) / expSum) * 100)
  }));
  
  probabilities.sort((a, b) => b.probability - a.probability);
  const topPredictions = probabilities.slice(0, 3);
  
  const confidence = probabilities[0].probability;
  const diseaseName = probabilities[0].label;
  
  return {
    diseaseName,
    confidence,
    maxVal,
    margin,
    logitGap,
    cropType,
    topPredictions
  };
}

export async function analyzeOffline(
  dataUrl: string, 
  userTargetCrop: string = 'general'
): Promise<DiagnosisResult> {
  try {
    // 1. Loading Quantized models for better performance/smaller size
    const resnetPath = '/models/resnet50_int8.onnx';
    const blackgramPath = '/models/blackgram_int8.onnx';

    const [sessResnet, sessBlackgram] = await Promise.all([
      getSession(resnetPath),
      getSession(blackgramPath)
    ]);

    // 2. Load and Preprocess image
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
    const preprocessedData = await preprocess(imageData);
    const tensor = new ort.Tensor('float32', preprocessedData, [1, 3, 224, 224]);

    // 3. Run models SEQUENTIALLY to avoid "Session already started" errors in WASM
    // Parallel execution (Promise.all) often fails in onnxruntime-web due to shared locks.
    const resChickpea = await runSingleInference(sessResnet, LABELS_RESNET50, tensor, 'Chickpea');
    const resBlackgram = await runSingleInference(sessBlackgram, LABELS_BLACKGRAM, tensor, 'Blackgram');

    // 4. Select winner based on higher confidence
    // NOTE: If user explicitly selected a crop, we might want to prioritize it,
    // but the request is for "whoever has higher confidence".
    const winner = resBlackgram.confidence > resChickpea.confidence ? resBlackgram : resChickpea;
    
    console.log(`[eCropGuard] Multi-model selection: Chickpea(${resChickpea.confidence}%) vs Blackgram(${resBlackgram.confidence}%) -> Winner: ${winner.cropType}`);

    // 5. Calculate Pixel Stats for Noise Rejection
    let sum = 0, sqSum = 0, colorDiffSum = 0, greenAdvantage = 0;
    const pData = imageData.data;
    const len = pData.length / 4;
    for (let i = 0; i < len; i++) {
        const idx = i * 4;
        const r = pData[idx], g = pData[idx + 1], b = pData[idx + 2];
        const avg = (r + g + b) / 3;
        sum += avg; sqSum += avg * avg;
        colorDiffSum += (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)) / 3;
        if (g > r + 10 && g > b + 10) greenAdvantage++;
    }
    const variance = (sqSum / len) - ((sum / len) * (sum / len));
    const avgColorDiff = colorDiffSum / len;
    const greenRatio = greenAdvantage / len;

    // 6. Advanced Noise Rejection
    let isLikelyNoise = false;
    if (avgColorDiff < 7.0) isLikelyNoise = true; 
    if (variance < 25 || variance > 8500) isLikelyNoise = true;
    if (greenRatio < 0.05) isLikelyNoise = true;

    // Model specific noise logic
    if (winner.cropType === 'Chickpea') {
      if (winner.maxVal < 3.0 || winner.margin < 1.0 || winner.confidence < 60) isLikelyNoise = true;
    } else {
      if (winner.confidence < 45 || winner.diseaseName.includes('Background') || winner.margin < 0.8) isLikelyNoise = true;
    }

    if (isLikelyNoise) {
      return {
        diseaseName: 'No Crop Detected',
        cropType: winner.cropType,
        confidence: 0,
        severity: 'low',
        description: `No clear ${winner.cropType.toLowerCase()} leaf detected. Ensure you are scanning a healthy or diseased leaf in clear, natural light.`,
        symptoms: [],
        causes: [],
        recommendations: [
          'Capture a clear, focused photo of a single leaf',
          'Ensure the leaf fills at least 50% of the camera frame',
          'Avoid scanning text, diagrams, or random objects'
         ],
        treatmentSteps: [],
        preventionTips: [],
        isHealthy: false,
        isLowConfidence: true
      };
    }

    const meta = getMetadata(winner.diseaseName);
    const isHealthy = winner.diseaseName.toLowerCase().includes('healthy');

    // Soft Computing: Fuzzy Logic
    let fuzzyConfidence: 'Low' | 'Medium' | 'High' = 'Low';
    if (winner.confidence >= 80) fuzzyConfidence = 'High';
    else if (winner.confidence >= 50) fuzzyConfidence = 'Medium';
    
    // Soft Computing: Uncertainty Handling
    let uncertaintyMessage = 'Confident prediction based on visual evidence.';
    if (fuzzyConfidence === 'Low') {
      uncertaintyMessage = 'Prediction extremely uncertain due to unclear image features. Please retake.';
    } else if (fuzzyConfidence === 'Medium') {
      uncertaintyMessage = 'Prediction moderately uncertain. Multiple disease possibilities exist.';
    }

    // Hybrid Reasoning: Symptom-Disease Graph (PGM-inspired)
    // Map observed symptoms from the top prediction to potential diseases with synthetic weights
    const symptomWeights = meta.symptoms.slice(0, 3).map(symptom => {
      const diseasesRecord: Record<string, number> = {};
      diseasesRecord[winner.diseaseName] = 0.6;
      if (winner.topPredictions[1]) diseasesRecord[winner.topPredictions[1].label] = 0.3;
      if (winner.topPredictions[2]) diseasesRecord[winner.topPredictions[2].label] = 0.1;
      return { symptom, diseases: diseasesRecord };
    });

    return {
      ...meta,
      diseaseName: winner.diseaseName,
      cropType: winner.cropType,
      confidence: winner.confidence,
      isHealthy,
      isLowConfidence: winner.cropType === 'Blackgram' ? winner.confidence < 50 : winner.confidence < 65,
      topPredictions: winner.topPredictions,
      fuzzyConfidence,
      uncertaintyMessage,
      symptomWeights
    };
  } catch (error) {
    console.error("Offline analysis failed:", error);
    throw new Error(`Offline model failed: ${error instanceof Error ? error.message : "Unknown error"}. Check if /models/ folder exists.`);
  }
}
