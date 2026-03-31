/**
 * native-onnx.ts
 *
 * TypeScript bridge to the native Android OnnxPlugin.
 * This calls ONNX Runtime for Android (not WASM) so it works reliably in Capacitor.
 *
 * On web/iOS (no native plugin), it falls back to a graceful error.
 */

import { registerPlugin } from '@capacitor/core';
import type { DiagnosisResult } from './gemini';
import { CONFIDENCE_THRESHOLD } from './gemini';

// ── Types ────────────────────────────────────────────────────────────────────

interface OnnxPredictOptions {
  /** Raw base64 string OR full data URL (data:image/jpeg;base64,...) */
  imageBase64: string;
  /** 'resnet50' for general crops, 'blackgram' for blackgram crop */
  model: 'resnet50' | 'blackgram';
}

interface OnnxPredictResult {
  label: string;
  confidence: number;   // 0–100 integer
  classIndex: number;
  allScores: Record<string, number>;
  rawLogits: Record<string, number>;
  modelUsed: string;
  timestamp: number;
}

interface OnnxPluginInterface {
  predict(options: OnnxPredictOptions): Promise<OnnxPredictResult>;
}

// Register the native Capacitor plugin
const OnnxPlugin = registerPlugin<OnnxPluginInterface>('OnnxPlugin');

// ── Disease metadata (label → extra info) ────────────────────────────────────
// ... (rest of metadata stays same)
// I'll skip re-writing the huge metadata block in the replacement if I can just target the interface and function.
// But replace_file_content needs a contiguous block. I'll target the interface and then the function separately or together.

// ── Disease metadata (label → extra info) ────────────────────────────────────

const DISEASE_META: Record<string, {
  description: string;
  symptoms: string[];
  causes: string[];
  recommendations: string[];
  treatmentSteps: string[];
  preventionTips: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}> = {
  'Healthy': {
    description: 'The crop appears to be in good health. No disease symptoms detected.',
    symptoms: [],
    causes: [],
    recommendations: ['Continue regular watering and monitoring', 'Maintain proper fertilization schedule'],
    treatmentSteps: [],
    preventionTips: ['Ensure proper drainage', 'Use nutrient-rich soil', 'Monitor crop regularly'],
    severity: 'low',
  },
  'Early Blight': {
    description: 'Early blight (Alternaria solani) detected — dark brown spots with concentric rings on lower leaves.',
    symptoms: ['Dark brown circular spots on leaves', 'Yellow halo around spots', 'Premature leaf drop'],
    causes: ['Fungal pathogen Alternaria solani', 'High humidity and warm temperatures', 'Water-stressed plants'],
    recommendations: ['Remove and destroy infected leaves', 'Apply copper-based fungicide', 'Avoid overhead irrigation'],
    treatmentSteps: ['Remove all visibly infected leaves immediately', 'Apply mancozeb or chlorothalonil fungicide', 'Improve air circulation around plants', 'Repeat spray every 7–10 days'],
    preventionTips: ['Rotate crops every season', 'Use disease-resistant varieties', 'Avoid wetting foliage when watering'],
    severity: 'medium',
  },
  'Late Blight': {
    description: 'Late blight (Phytophthora infestans) — water-soaked lesions rapidly destroying foliage and tubers.',
    symptoms: ['Water-soaked lesions on leaf edges', 'White fuzzy growth on leaf undersides', 'Brown rot on stems and tubers'],
    causes: ['Oomycete pathogen Phytophthora infestans', 'Cool wet weather (15–25°C)', 'High relative humidity >90%'],
    recommendations: ['Apply systemic fungicide immediately', 'Remove and bag all infected material', 'Avoid overhead watering'],
    treatmentSteps: ['Spray metalaxyl + mancozeb (Ridomil Gold) within 48h', 'Remove infected plant parts and dispose far from field', 'Drain standing water near field', 'Monitor every 3 days and re-spray if needed'],
    preventionTips: ['Plant certified disease-free seed', 'Use resistant varieties', 'Avoid planting in poorly drained soil'],
    severity: 'critical',
  },
  'Rust': {
    description: 'Rust disease detected — orange-brown pustules on leaf surface caused by fungal pathogens.',
    symptoms: ['Orange or reddish-brown pustules on leaves', 'Yellow spots on upper leaf surface', 'Powdery spore masses'],
    causes: ['Fungal rust pathogens (Puccinia spp.)', 'Moderate temperatures and high humidity', 'Wind dispersal of spores'],
    recommendations: ['Apply triazole fungicide (tebuconazole)', 'Improve air circulation', 'Avoid nitrogen over-fertilization'],
    treatmentSteps: ['Apply propiconazole or tebuconazole at first sign', 'Remove heavily infected leaves', 'Repeat treatment every 14 days', 'Check neighboring plants for spread'],
    preventionTips: ['Plant rust-resistant varieties', 'Avoid excessive nitrogen', 'Space plants adequately for ventilation'],
    severity: 'high',
  },
  'Cercospora Leaf Spot': {
    description: 'Cercospora leaf spot — small circular tan-grey spots with dark border on blackgram leaves.',
    symptoms: ['Small circular grey spots on leaves', 'Dark brown border around spots', 'Leaves turning yellow and dropping'],
    causes: ['Fungus Cercospora canescens', 'Warm humid weather', 'Dense plant canopy'],
    recommendations: ['Spray carbendazim or mancozeb', 'Thin plants to improve airflow', 'Remove infected leaves'],
    treatmentSteps: ['Apply mancozeb 75% WP at 2g/L water', 'Spray at 10-day intervals for 3 sprays', 'Remove badly infected lower leaves', 'Avoid waterlogging'],
    preventionTips: ['Use tolerant varieties', 'Avoid overhead irrigation', 'Maintain field hygiene'],
    severity: 'medium',
  },
  'Yellow Mosaic Virus': {
    description: 'Yellow Mosaic Virus (YMV) detected — viral disease spread by whiteflies causing mosaic yellowing.',
    symptoms: ['Irregular yellow and green mosaic on leaves', 'Stunted plant growth', 'Small malformed pods'],
    causes: ['Mungbean Yellow Mosaic Virus (MYMV)', 'Transmitted by whitefly (Bemisia tabaci)', 'Infected seed material'],
    recommendations: ['Control whitefly population immediately', 'Remove and destroy infected plants', 'Use imidacloprid insecticide'],
    treatmentSteps: ['Remove and burn all infected plants immediately', 'Spray imidacloprid 0.3ml/L to control whitefly', 'Plant tolerant varieties in next season', 'Maintain 30-day isolation from other legume fields'],
    preventionTips: ['Use virus-free certified seed', 'Grow yellow mosaic resistant varieties like Co 6', 'Control whitefly with reflective mulches'],
    severity: 'critical',
  },
  'Powdery Mildew': {
    description: 'Powdery mildew — white powdery coating on leaves caused by fungal infection.',
    symptoms: ['White powdery patches on upper leaf surface', 'Leaf distortion and yellowing', 'Premature defoliation'],
    causes: ['Fungus Erysiphe polygoni', 'Dry weather with high humidity nights', 'Dense planting with poor air circulation'],
    recommendations: ['Apply sulphur-based fungicide', 'Improve plant spacing', 'Avoid excessive fertilizer'],
    treatmentSteps: ['Spray wettable sulphur (2g/L) or dinocap', 'Repeat spray after 10 days', 'Remove heavily infected leaves', 'Improve air circulation by pruning'],
    preventionTips: ['Plant in well-ventilated areas', 'Avoid excess nitrogen', 'Use resistant varieties'],
    severity: 'medium',
  },
  'Anthracnose': {
    description: 'Anthracnose detected — dark sunken lesions on pods, stems and leaves of blackgram.',
    symptoms: ['Dark sunken spots on pods and stems', 'Salmon-pink spore masses in humid conditions', 'Dark water-soaked lesions on leaves'],
    causes: ['Fungus Colletotrichum truncatum', 'Rain splash dispersal', 'Infected seeds'],
    recommendations: ['Treat seeds with thiram before sowing', 'Spray carbendazim on foliage', 'Remove crop residues after harvest'],
    treatmentSteps: ['Apply carbendazim 0.1% or mancozeb 0.25% spray', 'Repeat every 10 days for 3 sprays', 'Destroy infected crop residue', 'Use hot water seed treatment (50°C for 20 min)'],
    preventionTips: ['Use disease-free certified seed', 'Practice crop rotation', 'Avoid waterlogging in field'],
    severity: 'high',
  },
};

function getMetaForLabel(label: string) {
  return DISEASE_META[label] ?? {
    description: `Disease detected: ${label}. Consult an agricultural expert.`,
    symptoms: ['Visible abnormal symptoms on leaves or stems'],
    causes: ['Environmental stress or pathogen infection'],
    recommendations: ['Consult a local agricultural expert', 'Take a sample to Krishi Vigyan Kendra'],
    treatmentSteps: ['Isolate affected plants', 'Contact an agricultural officer'],
    preventionTips: ['Monitor crops regularly', 'Maintain good field hygiene'],
    severity: 'medium' as const,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs ONNX inference natively on Android.
 * @param imageBase64  Raw base64 string or data URL
 * @param cropType     'blackgram' or 'general' (defaults to general → resnet50)
 */
export async function analyzeWithNativeOnnx(
  imageBase64: string,
  cropType: string = 'general'
): Promise<DiagnosisResult> {
  const model: 'resnet50' | 'blackgram' = cropType === 'blackgram' ? 'blackgram' : 'resnet50';

  let raw: OnnxPredictResult;
  try {
    raw = await OnnxPlugin.predict({ imageBase64, model });
    console.log(`[Native ONNX] Inference result for ${model}:`, {
      label: raw.label,
      confidence: raw.confidence,
      classIndex: raw.classIndex,
      allScores: raw.allScores,
      rawLogits: raw.rawLogits,
      modelUsed: raw.modelUsed,
      timestamp: new Date(raw.timestamp).toLocaleString()
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Native ONNX plugin failed: ${msg}. Make sure the app is built for Android and the models are in assets/public/models/.`);
  }

  const meta = getMetaForLabel(raw.label);
  const isHealthy = raw.label.toLowerCase().includes('healthy');
  const isLowConfidence = raw.confidence < CONFIDENCE_THRESHOLD;

  // Heuristic: If the range between max logit and min logit is too small, 
  // or if all logits are negative and close to each other, the model is likely seeing noise/non-crop.
  const logits = Object.values(raw.rawLogits);
  const maxLogit = Math.max(...logits);
  const minLogit = Math.min(...logits);
  const isLikelyNoise = (maxLogit - minLogit) < 2.0 && raw.confidence < 60;

  if (isLowConfidence || isLikelyNoise) {
    return {
      diseaseName: isLikelyNoise ? 'No Crop Detected' : 'Inconclusive Result',
      cropType: 'Unknown',
      confidence: raw.confidence,
      severity: 'low',
      description: isLikelyNoise 
        ? 'The AI does not recognize a supported crop in this image. Please ensure you are scanning a clear image of a supported leaf or stem.'
        : 'The AI is not confident enough to provide a diagnosis. This can happen if the image is blurry, poorly lit, or does not contain a supported crop.',
      symptoms: [],
      causes: [],
      recommendations: [
        'Ensure the crop is clearly visible and centered',
        'Check for good lighting before taking the photo',
        'Only scan supported crops (General crops or Blackgram)'
      ],
      treatmentSteps: [],
      preventionTips: [],
      isHealthy: false,
      isLowConfidence: true,
      allScores: raw.allScores,
      rawLogits: raw.rawLogits,
      modelUsed: raw.modelUsed,
      timestamp: raw.timestamp
    };
  }

  return {
    diseaseName: raw.label,
    cropType: model === 'blackgram' ? 'Blackgram' : 'General Crop',
    confidence: raw.confidence,
    severity: meta.severity,
    description: meta.description,
    symptoms: meta.symptoms,
    causes: meta.causes,
    recommendations: meta.recommendations,
    treatmentSteps: meta.treatmentSteps,
    preventionTips: meta.preventionTips,
    isHealthy,
    isLowConfidence: false,
    allScores: raw.allScores,
    rawLogits: raw.rawLogits,
    modelUsed: raw.modelUsed,
    timestamp: raw.timestamp
  };
}
