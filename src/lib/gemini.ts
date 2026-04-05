/**
 * gemini.ts
 *
 * Primary analysis entry point for eCropGuard.
 *
 * Priority order:
 *   1. Native ONNX (Android) — runs the trained ResNet50/Blackgram ONNX model locally, NO internet needed
 *   2. Gemini API          — cloud fallback if VITE_GEMINI_API_KEY is set
 *   3. Error               — tells the user exactly what went wrong
 */

import { Capacitor } from '@capacitor/core';
import { analyzeWithNativeOnnx } from './native-onnx';
import { analyzeOffline } from './offline-ai';
import { GoogleGenAI, Part } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export type DiagnosisResult = {
  diseaseName: string;
  cropType: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  symptoms: string[];
  causes: string[];
  recommendations: string[];
  treatmentSteps: string[];
  preventionTips: string[];
  isHealthy: boolean;
  isLowConfidence?: boolean;
  allScores?: Record<string, number>;
  rawLogits?: Record<string, number>;
  modelUsed?: string;
  timestamp?: number;
  // Enriched report fields
  impact?: string;
  organic_controls?: string[];
};

export const CONFIDENCE_THRESHOLD = 55; // Primary rejection is now logit gap; this is secondary

export async function analyzeCropImage(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  language: string = 'en'
): Promise<DiagnosisResult> {

  const pickBest = (res1: DiagnosisResult, res2: DiagnosisResult) => {
    const isNoCrop1 = res1.diseaseName === 'No Crop Detected' || res1.cropType === 'Unknown';
    const isNoCrop2 = res2.diseaseName === 'No Crop Detected' || res1.cropType === 'Unknown';
    
    // If one found a crop and the other didn't, pick the valid one
    if (!isNoCrop1 && isNoCrop2) return res1;
    if (isNoCrop1 && !isNoCrop2) return res2;
    
    // If both found crops, pick the one with higher confidence
    if (!isNoCrop1 && !isNoCrop2) {
      return res1.confidence >= res2.confidence ? res1 : res2;
    }
    
    // If both rejected, return a "stronger" rejection (higher detail)
    return res1.confidence >= res2.confidence ? res1 : res2;
  };

  // ── 1. NATIVE ONNX (Android) ──────────────────────────────────────────────
  if (Capacitor.isNativePlatform()) {
    console.log('[eCropGuard] Native Analysis...');
    
    const resBlackgram = await analyzeWithNativeOnnx(base64Image, 'blackgram');
    const resChickpea = await analyzeWithNativeOnnx(base64Image, 'resnet50');
    return pickBest(resBlackgram, resChickpea);
  }

  // ── 2. WEB ONNX (Offline Web) ─────────────────────────────────────────────
  try {
    console.log('[eCropGuard] Running Web ONNX inference (both models)...');
    const dataUrl = base64Image.startsWith('data:') 
       ? base64Image 
       : `data:${mimeType};base64,${base64Image}`;
       
    // Sequential to save memory on lower end devices since it's Web WASM
    const resBlackgram = await analyzeOffline(dataUrl, 'blackgram');
    const resChickpea = await analyzeOffline(dataUrl, 'resnet50');
    return pickBest(resBlackgram, resChickpea);
  } catch (err) {
    console.log('[eCropGuard] Web ONNX failed, falling back to Gemini if available...', err);
  }

  // ── 3. GEMINI API — web fallback if key is available ─────────────────────
  if (apiKey && apiKey.trim() !== '') {
    console.log('[eCropGuard] Running Gemini cloud inference...');
    return analyzeWithGemini(base64Image, mimeType, language);
  }

  // ── 4. No method available ────────────────────────────────────────────────
  throw new Error(
    'No analysis method available. On Android, make sure the app is built with the native ONNX plugin. ' +
    'On web, ensure the ONNX models are present in public/models or set VITE_GEMINI_API_KEY in your .env file.'
  );
}

// ── Gemini implementation (web fallback) ──────────────────────────────────────

async function analyzeWithGemini(
  base64Image: string,
  mimeType: string,
  language: string
): Promise<DiagnosisResult> {
  const ai = new GoogleGenAI({ apiKey });

  const languageMap: Record<string, string> = {
    en: 'English', hi: 'Hindi', mr: 'Marathi', pa: 'Punjabi',
    te: 'Telugu', ta: 'Tamil', kn: 'Kannada', gu: 'Gujarati', bn: 'Bengali',
  };
  const lang = languageMap[language] || 'English';

  const prompt = `You are an expert agricultural scientist and plant pathologist. Analyze this crop/plant image carefully and provide a detailed diagnosis in ${lang}.

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact structure:
{
  "diseaseName": "Name of disease or 'Healthy Crop' if no disease",
  "cropType": "Type of crop/plant detected",
  "confidence": 85,
  "severity": "low|medium|high|critical",
  "description": "Brief description of the condition in 1-2 sentences",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "causes": ["cause1", "cause2"],
  "recommendations": ["action1", "action2", "action3"],
  "treatmentSteps": ["step1", "step2", "step3", "step4"],
  "preventionTips": ["tip1", "tip2", "tip3"],
  "isHealthy": false
}

Rules:
- confidence is 0-100 integer
- severity must be exactly one of: low, medium, high, critical
- If crop is healthy, set isHealthy: true, severity: "low", diseaseName: "Healthy Crop"
- Provide practical, actionable advice for small-scale farmers
- All text in ${lang}`;

  const imagePart: Part = { inlineData: { mimeType, data: base64Image } };
  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
  });

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as DiagnosisResult;
  } catch {
    return {
      diseaseName: 'Analysis Complete',
      cropType: 'Unknown',
      confidence: 70,
      severity: 'medium',
      description: text.slice(0, 200),
      symptoms: [],
      causes: [],
      recommendations: ['Consult a local agricultural expert for detailed advice.'],
      treatmentSteps: ['Take the crop sample to your nearest Krishi Vigyan Kendra.'],
      preventionTips: ['Monitor crops regularly for early detection.'],
      isHealthy: false,
    };
  }
}
