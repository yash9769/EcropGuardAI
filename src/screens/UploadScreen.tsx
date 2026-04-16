import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CloudUpload, 
  AddAPhoto, 
  Close, 
  Analytics, 
  Lightbulb, 
  History,
  CheckCircle,
  Error as ErrorIcon
} from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { uploadAPI, DetectionResponse } from '../services/api';

interface UploadScreenProps {
  setScreen: (s: Screen) => void;
  setSelectedImg: (img: string | null) => void;
  setAnalysisResult: (res: any) => void;
}

export const UploadScreen = ({ setScreen, setSelectedImg, setAnalysisResult }: UploadScreenProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        setError(t('file_too_large', 'Image is too large. Maximum size is 10MB.'));
        return;
      }
      
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
      const currentLang = i18n.language.split('-')[0] || 'en';
      
      // Attempt backend visual analysis
      const diagnosis: DetectionResponse = await uploadAPI.analyzeImage(file, currentLang);
      
      if (!diagnosis || diagnosis.confidence === 0) {
        throw new Error(t('analyze_failed', 'Computer vision core returned inconclusive results. Please try a clearer photo.'));
      }

      // Map backend DetectionResponse to Frontend AnalysisScreen expected format
      const mappedResult = {
        disease: diagnosis.disease_name,
        crop: diagnosis.crop_type,
        confidence: diagnosis.confidence,
        pathogen: diagnosis.disease_name,
        risk_level: diagnosis.severity,
        reasoning: [
          diagnosis.description,
          ...(diagnosis.symptoms?.slice(0, 2) || []),
          ...(diagnosis.impact ? [diagnosis.impact] : [])
        ].filter(Boolean),
        treatment: diagnosis.treatment_steps && diagnosis.treatment_steps.length > 0 
          ? diagnosis.treatment_steps 
          : diagnosis.recommendations,
        prevention: diagnosis.prevention_tips || [],
        is_healthy: diagnosis.is_healthy,
        organic_controls: diagnosis.organic_controls || []
      };

      setAnalysisResult(mappedResult);
      setScreen('analysis');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.detail || err.message || t('analyze_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <TopBar title={t('analyze_crop_health')} activeScreen="crop-health" setScreen={setScreen} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <header className="mb-10 sm:mb-12">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block"
          >
            {t('visual_diagnosis', 'AI Visual Diagnosis')}
          </motion.span>
          <h2 className="font-headline text-4xl sm:text-5xl font-extrabold text-primary tracking-tight mb-4">
            {t('analyze_crop_health')}
          </h2>
          <p className="text-on-surface-variant max-w-xl text-base sm:text-lg leading-relaxed">
            {t('upload_photo_intro')}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Upload Area */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div 
              className="relative group cursor-pointer"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.005 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute -inset-1 signature-gradient opacity-10 blur-2xl group-hover:opacity-20 transition duration-500"></div>
              <div className="relative bg-white border-2 border-dashed border-emerald-900/10 rounded-3xl p-8 sm:p-16 transition-all duration-300 hover:border-emerald-800/30 min-h-[360px] sm:min-h-[440px] flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <CloudUpload className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-800" />
                </div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-2">{t('drag_drop_photos')}</h3>
                <p className="text-on-surface-variant mb-8 max-w-xs text-sm">{t('supports_jpg_png')}</p>
                <div className="signature-gradient text-white px-8 py-4 rounded-xl font-headline font-bold flex items-center gap-3 shadow-xl shadow-emerald-950/20 active:scale-95 transition-all">
                  <AddAPhoto className="w-5 h-5" />
                  {t('select_plant_photo')}
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl p-6 flex items-center gap-6 border border-emerald-900/10 shadow-lg"
                >
                  <div className="w-14 h-14 bg-emerald-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ring-4 ring-emerald-50">
                    <Analytics className="w-7 h-7 text-emerald-800 animate-spin-slow" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="font-headline font-bold text-primary text-sm uppercase tracking-wide">{t('analyzing_plant_health')}</p>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/50 px-3 py-1 rounded-full animate-pulse">{t('processing')}</span>
                    </div>
                    <div className="w-full bg-emerald-100/30 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '92%' }}
                        transition={{ duration: 15, ease: "linear" }}
                        className="h-full signature-gradient rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm"
                >
                  <ErrorIcon className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview Panel */}
          <aside className="lg:col-span-4 space-y-6 sticky top-8">
            <div className="bg-white rounded-3xl overflow-hidden shadow-premium border border-emerald-900/5">
              <div className="aspect-square relative bg-emerald-50/30">
                {preview ? (
                  <img 
                    className="w-full h-full object-cover" 
                    src={preview} 
                    alt="Upload Preview" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-900/10">
                    <ImageIcon size={64} fill="currentColor" />
                  </div>
                )}
                {preview && (
                  <button 
                    onClick={() => { setPreview(null); setFile(null); setSelectedImg(null); }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all z-10"
                  >
                    <Close size={18} />
                  </button>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{t('file_info', 'File Analysis')}</span>
                  {file && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>

                <button 
                  disabled={!file || loading}
                  onClick={handleAnalyze}
                  className="w-full py-4 signature-gradient text-white rounded-xl font-headline font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <Analytics size={22} className={loading ? "animate-spin" : ""} />
                  {loading ? t('processing') : t('analyze_now')}
                </button>
              </div>
            </div>

            <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="font-headline font-bold text-sm uppercase tracking-widest">{t('pro_tip')}</h4>
              </div>
              <p className="text-sm leading-relaxed text-emerald-100/70 border-l-2 border-emerald-500/30 pl-4 py-1">
                {t('pro_tip_text')}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// Re-using local icon component locally if needed, but they are imported from index.css style markers usually or external icons.
const ImageIcon = ({ size = 24, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);
