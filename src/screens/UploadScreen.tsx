import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudUpload, AddAPhoto, Close, Analytics, Lightbulb, History } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { motion } from 'motion/react';
import { analyzeCropImage } from '../lib/gemini';
import { uploadAPI } from '../services/api';

interface UploadScreenProps {
  setScreen: (s: Screen) => void;
  setSelectedImg: (img: string | null) => void;
  setAnalysisResult: (res: any) => void;
}

export const UploadScreen = ({ setScreen, setSelectedImg, setAnalysisResult }: UploadScreenProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setSelectedImg(result);
      };
      reader.readAsDataURL(f);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError(t('please_select_image'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!preview) {
        throw new Error(t('image_preview_unavailable'));
      }

      let diagnosis: any = null;

      try {
        // Use our backend's /detect-disease endpoint
        const apiResponse = await uploadAPI.analyzeImage(file, 'en');
        if (apiResponse && typeof apiResponse === 'object' && apiResponse.disease_name) {
          diagnosis = apiResponse;
        }
      } catch (apiError) {
        console.warn('Backend detect-disease failed, falling back to local Gemini:', apiError);
        diagnosis = null;
      }

      // Fallback to local Gemini if backend is unavailable
      if (!diagnosis) {
        const geminiResult = await analyzeCropImage(preview, file?.type || 'image/jpeg');
        if (geminiResult) {
          // Normalise from camelCase Gemini response to our standard shape
          diagnosis = {
            disease_name: geminiResult.diseaseName,
            crop_type: geminiResult.cropType,
            confidence: geminiResult.confidence,
            severity: geminiResult.severity,
            description: geminiResult.description,
            symptoms: geminiResult.symptoms || [],
            causes: geminiResult.causes || [],
            recommendations: geminiResult.recommendations || [],
            treatment_steps: geminiResult.treatmentSteps || [],
            prevention_tips: geminiResult.preventionTips || [],
            is_healthy: geminiResult.isHealthy || false,
          };
        }
      }

      if (!diagnosis) throw new Error(t('analyze_failed'));

      const mappedResult = {
        disease: diagnosis.disease_name,
        crop: diagnosis.crop_type,
        confidence: diagnosis.confidence,
        pathogen: diagnosis.disease_name,
        risk_level: diagnosis.severity,
        reasoning: [
          diagnosis.description,
          ...(diagnosis.symptoms?.slice(0, 2) || []),
          ...(diagnosis.causes?.slice(0, 1) || []),
        ].filter(Boolean),
        treatment: diagnosis.treatment_steps || [],
        prevention: diagnosis.prevention_tips || [],
      };

      setAnalysisResult(mappedResult);
      setScreen('analysis');
    } catch (err: any) {
      setError(err.message || t('analyze_failed'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('analyze_crop_health')} activeScreen="crop-health" setScreen={setScreen} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full scrollbar-hide">
        <div className="mb-12">
          <span className="text-xs font-bold text-on-tertiary-container uppercase tracking-[0.2em] mb-2 block">{t('visual_diagnosis')}</span>
          <h2 className="font-headline text-5xl font-extrabold text-primary tracking-tight mb-4">{t('analyze_crop_health')}</h2>
          <p className="text-on-surface-variant max-w-xl text-lg leading-relaxed">
            {t('upload_photo_intro')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <motion.div 
              className="relative group cursor-pointer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute -inset-1 signature-gradient opacity-10 blur-xl group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-surface-container-lowest border-2 border-dashed border-emerald-900/20 rounded-[2rem] p-12 transition-all duration-300 hover:border-emerald-800/40 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <CloudUpload className="w-10 h-10 text-emerald-800" />
                </div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-2">{t('drag_drop_photos')}</h3>
                <p className="text-on-surface-variant mb-8 max-w-xs">{t('supports_jpg_png')}</p>
                <button className="signature-gradient text-white px-8 py-4 rounded-full font-headline font-bold flex items-center gap-3 shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 transition-all active:scale-95 pointer-events-none">
                  <AddAPhoto className="w-5 h-5" />
                  {t('select_plant_photo')}
                </button>
              </div>
            </motion.div>

            {loading && (
              <div className="bg-surface-container-low rounded-[1.5rem] p-6 flex items-center gap-6 border border-emerald-900/5">
                <div className="w-16 h-16 bg-surface-container-highest rounded-xl overflow-hidden flex-shrink-0">
                  <div className="w-full h-full bg-emerald-100/50 animate-pulse"></div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-headline font-semibold text-primary">{t('analyzing_plant_health')}</p>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full animate-pulse">{t('processing')}</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <motion.div 
                      key="progress"
                      initial={{ width: 0 }}
                      animate={{ width: '90%' }}
                      transition={{ duration: 10 }}
                      className="h-full signature-gradient rounded-full shadow-[0_0_10px_rgba(27,67,50,0.4)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-bold flex items-center gap-3">
                <span>⚠️</span> {error}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm border border-emerald-900/5">
              <motion.div className="aspect-square relative group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                {preview ? (
                  <img 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    src={preview} 
                    alt="Leaf preview" 
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant/20 italic text-sm">{t('no_image_selected')}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                {preview && (
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">{t('preview')}</span>
                      <p className="text-white font-headline font-bold truncate">{file?.name}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); setSelectedImg(null); }}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors"
                    >
                      <Close className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('metadata')}</span>
                <span className="text-xs text-on-surface-variant">{file ? t('image_size_mb', { size: (file.size / (1024 * 1024)).toFixed(2) }) : '-'}</span>
              </div>

              <motion.button 
                  disabled={!file || loading}
                  whileHover={!file && !loading ? { scale: 1.02 } : undefined}
                  whileTap={!file && !loading ? { scale: 0.98 } : undefined}
                  onClick={handleAnalyze}
                  className="w-full py-4 signature-gradient text-white rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <Analytics className="w-6 h-6" />
                  {loading ? t('analyzing_plant_health') : t('analyze_now')}
                </motion.button>
              </div>
            </div>

            <div className="bg-tertiary-container rounded-[1.5rem] p-6 text-on-tertiary">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-6 h-6 text-on-tertiary-container" />
                <h4 className="font-headline font-bold text-on-tertiary-container">{t('pro_tip')}</h4>
              </div>
              <p className="text-sm leading-relaxed text-on-tertiary-container/80">
                {t('pro_tip_text')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
