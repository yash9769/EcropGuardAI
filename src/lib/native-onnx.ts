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
  imgMean?: number;
  imgStdDev?: number;
  isNoise: boolean;
  saturation: number;
  variance: number;
  timestamp: number;
}

interface OnnxPluginInterface {
  predict(options: OnnxPredictOptions): Promise<OnnxPredictResult>;
}

// Register the native Capacitor plugin
const OnnxPlugin = registerPlugin<OnnxPluginInterface>('OnnxPlugin');

import { getMetadata } from './crop-metadata';

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs ONNX inference natively on Android.
 *
 * PER-MODEL CALIBRATION (validated by running the actual ONNX models on synthetic images):
 *
 * resnet50.onnx (chickpea diseases):
 *   - Real leaf:    maxLogit > 3.5, logitGap > 8   (e.g. green leaf: max=6.5, gap=15)
 *   - Noise/wall:   maxLogit ~0.1,  logitGap ~1.9
 *   → Reject if: maxLogit < 2.5 OR logitGap < 5.0
 *
 * blackgram.onnx:
 *   - The blackgram model operates in a MUCH lower logit range (max ~1-3)
 *   - Noise images also produce similar logit ranges (max ~1.2-1.4)
 *   - Logit-based rejection is NOT reliable for the blackgram model
 *   → Rely on confidence: noise images give ~35-43%, real leaves give ~48-85%
 *   → Reject only if confidence < 35% (near-uniform = fully confused)
 */
export async function analyzeWithNativeOnnx(
  imageBase64: string,
  cropType: string = 'general'
): Promise<DiagnosisResult> {
  const model: 'resnet50' | 'blackgram' = cropType === 'blackgram' ? 'blackgram' : 'resnet50';

  let raw: OnnxPredictResult;
  try {
    raw = await OnnxPlugin.predict({ imageBase64, model });
    
    const logits = raw.rawLogits || {};
    const logitValues = Object.values(logits) as number[];
    const maxLogit = logitValues.length > 0 ? Math.max(...logitValues) : 0;
    const minLogit = logitValues.length > 0 ? Math.min(...logitValues) : 0;

    console.log(`[Native ONNX] → ${raw.label} (${raw.confidence}%)`, {
      maxLogit,
      logitGap: maxLogit - minLogit,
      imgStdDev: raw.imgStdDev,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Native ONNX plugin failed: ${msg}. Make sure the app is built for Android and the models are in assets/public/models/.`);
  }

  const meta = getMetadata(raw.label);
  const isHealthy = raw.label.toLowerCase().includes('healthy');

  // ── Unified Noise Rejection ────────────────────────────────────────────────
  // The native plugin now calculates isNoise based on saturation, variance, 
  // and model-specific logit thresholds (for chickpea).
  let isLikelyNoise = raw.isNoise || raw.label === 'Unknown/Background';

  // Backwards compatibility/safety check for models like blackgram 
  // where logits are still variable.
  if (model === 'blackgram' && raw.confidence < 30) {
    isLikelyNoise = true;
  }

  const noiseReason = raw.isNoise ? 'Flag' : 'Fallback';
  console.log(`[Native ONNX] Noise Check: ${isLikelyNoise ? `REJECTED (${noiseReason})` : 'PASSED'} | Sat: ${raw.saturation?.toFixed(2)} | Var: ${raw.variance?.toFixed(0)}`);

  if (isLikelyNoise) {
    return {
      diseaseName: 'No Crop Detected',
      cropType: 'Unknown',
      confidence: raw.confidence,
      severity: 'low',
      description: model === 'resnet50'
        ? 'No supported crop leaf detected. This model recognises chickpea disease classes. Point the camera directly at a leaf.'
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
      isLowConfidence: true,
      allScores: raw.allScores,
      rawLogits: raw.rawLogits,
      modelUsed: raw.modelUsed,
      timestamp: raw.timestamp,
    };
  }

  // Blackgram model has a lower effective confidence range — flag but still show result
  const isLowConfidence = model === 'blackgram' ? raw.confidence < 50 : raw.confidence < 60;

    // Probabilistic Reasoning: Top 3 Predictions
    const probEntries = Object.entries(raw.allScores || {}).map(([label, probability]) => {
      // The native plugin might return raw probabilities as 0-1 floats or 0-100 ints, check bounds
      const probValue = probability <= 1.01 ? Math.round(probability * 100) : Math.round(probability);
      return { label, probability: probValue };
    });
    probEntries.sort((a, b) => b.probability - a.probability);
    const topPredictions = probEntries.slice(0, 3);
    
    // Soft Computing: Fuzzy Logic
    let fuzzyConfidence: 'Low' | 'Medium' | 'High' = 'Low';
    if (raw.confidence >= 80) fuzzyConfidence = 'High';
    else if (raw.confidence >= 50) fuzzyConfidence = 'Medium';
    
    // Soft Computing: Uncertainty Handling
    let uncertaintyMessage = 'Confident prediction based on visual evidence.';
    if (fuzzyConfidence === 'Low') {
      uncertaintyMessage = 'Prediction extremely uncertain due to unclear image features. Please retake.';
    } else if (fuzzyConfidence === 'Medium') {
      uncertaintyMessage = 'Prediction moderately uncertain. Multiple disease possibilities exist.';
    }
    
    // Hybrid Reasoning: Symptom-Disease Graph (PGM-inspired)
    const symptomWeights = meta.symptoms.slice(0, 3).map(symptom => {
      const diseasesRecord: Record<string, number> = {};
      diseasesRecord[raw.label] = 0.6;
      if (topPredictions[1]) diseasesRecord[topPredictions[1].label] = 0.3;
      if (topPredictions[2]) diseasesRecord[topPredictions[2].label] = 0.1;
      return { symptom, diseases: diseasesRecord };
    });

  return {
    diseaseName: raw.label,
    cropType: model === 'blackgram' ? 'Blackgram' : 'Chickpea',
    confidence: raw.confidence,
    severity: meta.severity,
    description: meta.description,
    symptoms: meta.symptoms,
    causes: meta.causes,
    recommendations: meta.recommendations,
    treatmentSteps: meta.treatmentSteps,
    preventionTips: meta.preventionTips,
    impact: meta.impact,
    organic_controls: meta.organic_controls,
    isHealthy,
    isLowConfidence,
    allScores: raw.allScores,
    rawLogits: raw.rawLogits,
    modelUsed: raw.modelUsed,
    timestamp: raw.timestamp,
    topPredictions,
    fuzzyConfidence,
    uncertaintyMessage,
    symptomWeights
  };
}
