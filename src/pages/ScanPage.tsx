import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera, Upload, X, ChevronRight, ChevronDown,
  Leaf, Zap, AlertTriangle, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { analyzeCropImage, type DiagnosisResult } from '../lib/gemini';
import { fileToBase64, dataUrlToBase64, getSeverityColor } from '../lib/utils';
import SeverityBadge from '../components/SeverityBadge';
import ConfidenceRing from '../components/ConfidenceRing';
import i18n from '../i18n/i18n';

interface ScanPageProps {
  onSave: (scan: {
    image_url: string | null;
    disease_name: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    crop_type: string;
    recommendations: string[];
    treatment_steps: string[];
    raw_ai_response: string;
    language: string;
  }) => Promise<unknown>;
}

type Step = 'select' | 'preview' | 'analyzing' | 'result';

function ExpandSection({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="glass rounded-2xl overflow-hidden"
      style={{ border: `1px solid color-mix(in srgb, ${color}, transparent 85%)` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 press"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `color-mix(in srgb, ${color}, transparent 90%)` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span className="flex-1 text-left font-display font-semibold text-sm" style={{ color: 'var(--text)' }}>
          {title}
        </span>
        <ChevronDown
          size={16}
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-up">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ScanPage({ onSave }: ScanPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('select');
  const [imageData, setImageData] = useState<string | null>(null); // base64 or data URL for preview
  const [imageMime, setImageMime] = useState('image/jpeg');
  // cropType is no longer needed in state as we evaluate both automatically
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function takePhoto() {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (photo.dataUrl) {
        setImageData(photo.dataUrl);
        setImageMime(photo.format === 'png' ? 'image/png' : 'image/jpeg');
        setStep('preview');
      }
    } catch {
      // Camera not available (web fallback)
      fileRef.current?.click();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imageData) return;
    setStep('analyzing');
    setAnalyzeError('');
    try {
      const base64 = imageData.startsWith('data:') ? dataUrlToBase64(imageData) : imageData;
      const diagnosis = await analyzeCropImage(base64, imageMime, i18n.language);
      setResult(diagnosis);
      setStep('result');
    } catch (e: unknown) {
      setAnalyzeError(e instanceof Error ? e.message : t('error'));
      setStep('preview');
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await onSave({
        image_url: null,
        disease_name: result.diseaseName,
        confidence: result.confidence,
        severity: result.severity,
        crop_type: result.cropType,
        recommendations: result.recommendations,
        treatment_steps: result.treatmentSteps,
        raw_ai_response: JSON.stringify(result),
        language: i18n.language,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStep('select');
    setImageData(null);
    setResult(null);
    setSaved(false);
    setAnalyzeError('');
  }

  // ---- SELECT STEP ----
  if (step === 'select') {
    return (
      <div className="flex flex-col min-h-screen px-4 pt-16 pb-28 bg-mesh">
        <div className="animate-fade-up mb-8">
          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text)' }}>
            {t('scan_title')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('scan_subtitle')}</p>
        </div>



        {/* Camera option */}
        <button
          onClick={takePhoto}
          className="relative glass rounded-3xl overflow-hidden press animate-fade-up delay-100 mb-4"
          style={{ padding: '28px 24px', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          <div
            className="absolute right-0 bottom-0 w-32 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)' }}
          />
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 glow-green"
              style={{ background: 'linear-gradient(135deg, #1a3a1a 0%, #0f2a0f 100%)', border: '1px solid rgba(74,222,128,0.3)' }}
            >
              <Camera size={26} style={{ color: '#4ade80' }} />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-base mb-0.5" style={{ color: 'var(--text)' }}>{t('take_photo')}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Use camera for best results</p>
            </div>
            <ChevronRight size={18} className="ml-auto flex-shrink-0" style={{ color: '#3d5c3d' }} />
          </div>
        </button>

        {/* Upload option */}
        <button
          onClick={() => fileRef.current?.click()}
          className="relative glass rounded-3xl overflow-hidden press animate-fade-up delay-200"
          style={{ padding: '28px 24px', border: '1px solid rgba(96,165,250,0.2)' }}
        >
          <div
            className="absolute right-0 bottom-0 w-32 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)' }}
          />
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)' }}
            >
              <Upload size={26} style={{ color: '#60a5fa' }} />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-base mb-0.5" style={{ color: 'var(--text)' }}>{t('upload_image')}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload from gallery</p>
            </div>
            <ChevronRight size={18} className="ml-auto flex-shrink-0" style={{ color: '#3d5c3d' }} />
          </div>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Instructions */}
        <div className="mt-6 glass rounded-2xl p-4 animate-fade-up delay-300">
          <p className="text-xs font-display font-semibold mb-3" style={{ color: 'var(--green)' }}>📸 Guidelines for accurate results</p>
          {[
            'ONLY scan supported crops (leaves/stems/pods)',
            'Avoid scanning hands, soil, or mixed backgrounds',
            'Ensure bright, natural light (avoid shadows)',
            'Keep leaves flat and centered in the frame',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
              <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: 'var(--green)' }}>•</span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- PREVIEW STEP ----
  if (step === 'preview') {
    return (
      <div className="flex flex-col min-h-screen px-4 pt-16 pb-28 bg-mesh">
        <div className="flex items-center gap-3 mb-6 animate-fade-up">
          <button onClick={reset} className="w-9 h-9 rounded-xl flex items-center justify-center press" style={{ background: 'var(--green-glow)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--green)' }} />
          </button>
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>Preview</h1>
        </div>

        {/* Image */}
        <div className="animate-scale-in relative rounded-3xl overflow-hidden mb-5" style={{ border: '1px solid rgba(74,222,128,0.2)' }}>
          <img
            src={imageData!}
            alt="Crop to analyze"
            className="w-full object-cover"
            style={{ maxHeight: 340 }}
          />
          <button
            onClick={reset}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <X size={16} style={{ color: '#ffffff' }} />
          </button>
        </div>

        {analyzeError && (
          <div
            className="glass rounded-2xl p-3 mb-4 text-sm flex items-center gap-2 animate-fade-up"
            style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <AlertTriangle size={16} />
            {analyzeError}
          </div>
        )}

        <button
          onClick={analyze}
          className="w-full py-4 rounded-2xl font-display font-bold text-base press"
          style={{
            background: 'linear-gradient(135deg, var(--green-dim) 0%, var(--green) 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 24px var(--green-glow)',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Zap size={18} />
            {t('analyze')}
          </span>
        </button>
      </div>
    );
  }

  // ---- ANALYZING STEP ----
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-mesh">
        {/* Image with scan overlay */}
        <div className="relative w-64 h-64 rounded-3xl overflow-hidden mb-8 animate-scale-in" style={{ border: '1px solid rgba(74,222,128,0.2)' }}>
          <img src={imageData!} alt="" className="w-full h-full object-cover" />

          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-0.5 animate-scan-line"
            style={{ background: 'linear-gradient(90deg, transparent 0%, #4ade80 50%, transparent 100%)', boxShadow: '0 0 8px #4ade80' }}
          />

          {/* Corner brackets */}
          {[['top-2 left-2', 'border-t-2 border-l-2'], ['top-2 right-2', 'border-t-2 border-r-2'], ['bottom-2 left-2', 'border-b-2 border-l-2'], ['bottom-2 right-2', 'border-b-2 border-r-2']].map(([pos, borders], i) => (
            <div key={i} className={`absolute ${pos} w-6 h-6 ${borders} rounded-sm`} style={{ borderColor: '#4ade80' }} />
          ))}

          <div className="absolute inset-0" style={{ background: 'rgba(6,13,6,0.3)' }} />
        </div>

        {/* Pulse rings */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-16 h-16 rounded-full animate-pulse-ring" style={{ background: 'rgba(74,222,128,0.15)' }} />
          <div className="absolute w-16 h-16 rounded-full animate-pulse-ring delay-300" style={{ background: 'rgba(74,222,128,0.1)' }} />
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center glow-green"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' }}
          >
            <Leaf size={24} style={{ color: '#060d06' }} />
          </div>
        </div>

        <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>
          {t('analyzing')}
        </h2>
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)', maxWidth: 220 }}>
          AI is examining your crop for diseases and deficiencies
        </p>

        {/* Animated dots */}
        <div className="flex gap-1.5 mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#4ade80',
                animation: 'wave 1s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- RESULT STEP ----
  if (step === 'result' && result) {
    const sevColor = getSeverityColor(result.severity);
    return (
      <div className="flex flex-col min-h-screen px-4 pt-14 pb-28 bg-mesh overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 animate-fade-up">
          <button onClick={reset} className="w-9 h-9 rounded-xl flex items-center justify-center press" style={{ background: 'var(--green-glow)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--green)' }} />
          </button>
          <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>{t('result_title')}</h1>
        </div>

        {/* Hero card */}
        <div
          className="glass rounded-3xl p-5 mb-4 animate-scale-in relative overflow-hidden"
          style={{ border: `1px solid ${sevColor}25` }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${sevColor}12 0%, transparent 70%)` }}
          />

          {/* Image thumbnail */}
          {imageData && (
            <div className="relative rounded-2xl overflow-hidden mb-4 h-36">
              <img src={imageData} alt="" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(6,13,6,0.7) 100%)' }}
              />
              {result.isHealthy && !result.isLowConfidence && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold"
                  style={{ background: 'rgba(74,222,128,0.85)', color: '#060d06' }}
                >
                  <CheckCircle2 size={12} /> Healthy
                </div>
              )}
              {result.isLowConfidence && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold"
                  style={{ background: 'rgba(251,191,36,0.85)', color: '#060d06' }}
                >
                  <AlertTriangle size={12} /> Low Confidence
                </div>
              )}
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-lg leading-tight mb-1" style={{ color: 'var(--text)' }}>
                {result.diseaseName}
              </h2>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{result.cropType}</p>
              <SeverityBadge severity={result.severity} />
            </div>
            <ConfidenceRing value={result.confidence} />
          </div>

          {result.description && (
            <p className="text-sm mt-4 pt-4 leading-relaxed" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
              {result.description}
            </p>
          )}

          {/* Raw inference details (Debug mode) */}
          {(result.allScores || result.rawLogits) && (
            <div className="mt-4 pt-4 border-t border-white/5 opacity-80">
              <button 
                onClick={(e) => {
                  const target = e.currentTarget.nextElementSibling as HTMLDivElement;
                  target.classList.toggle('hidden');
                }}
                className="text-[10px] text-[var(--green)] font-bold flex items-center gap-1 hover:brightness-125 bg-[var(--green-glow)] px-2 py-1 rounded"
              >
                <Zap size={10} /> VERIFY NATIVE AI OUTPUT
              </button>
              <div className="hidden mt-3 space-y-3 px-1">
                <div className="grid grid-cols-1 gap-2 bg-black/5 p-2 rounded-lg">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-[var(--text-muted)]">Model:</span>
                    <span className="text-[var(--text)] truncate max-w-[150px]">{result.modelUsed || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-[var(--text-muted)]">Inference Time:</span>
                    <span className="text-[var(--text)]">{result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] text-[var(--green)] font-bold uppercase tracking-wider">Probabilities (%)</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(result.allScores || {}).map(([lbl, val]) => {
                      const percent = val <= 1.01 ? Math.round(val * 100) : Math.round(val);
                      return (
                        <div key={lbl} className="flex justify-between text-[9px] text-[var(--text-muted)]">
                          <span className="truncate mr-1">{lbl}</span>
                          <span className={percent > 50 ? 'text-[var(--green)] font-bold' : ''}>{percent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {result.rawLogits && (
                  <div className="space-y-1">
                    <p className="text-[9px] text-[var(--blue)] font-bold uppercase tracking-wider">Raw Model Logits</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(result.rawLogits).map(([lbl, val]) => (
                        <div key={lbl} className="flex justify-between text-[9px] text-[var(--text-muted)]">
                          <span className="truncate mr-1">{lbl}</span>
                          <span className="text-[var(--blue)] font-mono">{val.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-[8px] italic text-[var(--text-muted)] leading-tight border-l border-[var(--green)] pl-2">
                  Note: AI models always pick a class even if the image is noise. Precise logits prove real-time computation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expandable sections */}
        <div className="flex flex-col gap-3 animate-fade-up delay-200">
          {result.symptoms.length > 0 && (
            <ExpandSection title="Symptoms" icon={AlertTriangle} color="var(--amber)">
              <ul className="space-y-2">
                {result.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }}>•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </ExpandSection>
          )}

          {result.recommendations.length > 0 && (
            <ExpandSection title={t('recommendations')} icon={Zap} color="var(--green)">
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }}>→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </ExpandSection>
          )}

          {result.treatmentSteps.length > 0 && (
            <ExpandSection title={t('treatment')} icon={Leaf} color="var(--blue)">
              <ol className="space-y-3">
                {result.treatmentSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xs"
                      style={{ background: 'var(--blue)', color: '#ffffff' }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{step}</span>
                  </li>
                ))}
              </ol>
            </ExpandSection>
          )}

          {result.preventionTips.length > 0 && (
            <ExpandSection title={t('prevention')} icon={CheckCircle2} color="var(--green)">
              <ul className="space-y-2">
                {result.preventionTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }}>✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </ExpandSection>
          ) }
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5 animate-fade-up delay-400">
          <button
            onClick={reset}
            className="flex-1 py-3.5 rounded-2xl font-display font-semibold text-sm press"
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            {t('scan_again')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm press disabled:opacity-60"
            style={{
              background: saved
                ? 'var(--green-glow)'
                : 'linear-gradient(135deg, var(--green-dim) 0%, var(--green) 100%)',
              color: saved ? 'var(--green)' : '#ffffff',
              border: saved ? '1px solid var(--green)' : 'none',
              boxShadow: saved ? 'none' : '0 4px 20px var(--green-glow)',
            }}
          >
            {saving ? '...' : saved ? `✓ ${t('saved')}` : t('save_result')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
