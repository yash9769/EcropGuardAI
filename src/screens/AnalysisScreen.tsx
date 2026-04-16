import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  BarChart, 
  Analytics, 
  Psychology, 
  GridView, 
  Bolt, 
  Shield, 
  Spa, 
  Info,
  Warning,
  Error as ErrorIcon
} from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AnalysisScreenProps {
  setScreen: (s: Screen) => void;
  image: string | null;
  result: {
    disease: string;
    crop: string;
    confidence: number;
    pathogen: string;
    risk_level: string;
    reasoning: string[];
    treatment: string[];
    prevention: string[];
    is_healthy?: boolean;
    organic_controls?: string[];
  } | null;
}

export const AnalysisScreen = ({ setScreen, image, result }: AnalysisScreenProps) => {
  const { t } = useTranslation();
  
  const formatLabel = (label: string) => label?.replace(/_/g, ' ') || '';

  if (!result) {
    return (
      <div className="flex-1 flex flex-col h-full bg-surface">
        <TopBar title={t('diagnosis_result')} activeScreen="crop-health" setScreen={setScreen} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner">
              <Analytics className="w-10 h-10 text-emerald-800/40" />
            </div>
            <h3 className="text-xl font-headline font-bold text-primary mb-2">{t('no_analysis_data_found')}</h3>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
              We couldn't find a recent analysis result. Please capture or upload a new photo.
            </p>
            <button 
              onClick={() => setScreen('crop-health')}
              className="w-full py-4 signature-gradient text-white rounded-xl font-headline font-bold shadow-lg active:scale-95 transition-all"
            >
              {t('go_back_to_upload')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isHealthy = result.is_healthy;

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <TopBar title={t('diagnosis_result')} activeScreen="crop-health" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Status Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 shadow-sm border",
            isHealthy 
              ? "bg-emerald-50 border-emerald-900/10 text-emerald-900" 
              : "bg-amber-50 border-amber-900/10 text-amber-900"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
            isHealthy ? "bg-emerald-800 text-white" : "bg-amber-600 text-white"
          )}>
            {isHealthy ? <CheckCircle size={32} /> : <Warning size={32} />}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 block">
              {isHealthy ? t('healthy_status', 'Crop Health Secured') : t('action_required', 'Field Action Recommended')}
            </span>
            <h2 className="text-2xl font-headline font-extrabold tracking-tight">
              {isHealthy 
                ? t('your_crop_looks_healthy', 'No disease detected in your crop.') 
                : `${t('detected_label', 'Detected')}: ${formatLabel(result.disease)}`}
            </h2>
          </div>
          <div className="flex flex-col items-center sm:items-end">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">AI Trust Score</span>
             <div className="text-3xl font-headline font-black">{result.confidence}%</div>
          </div>
        </motion.div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Diagnostic Imagery */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-12 xl:col-span-8 relative group overflow-hidden rounded-[2.5rem] bg-emerald-950 aspect-video lg:aspect-[21/9] shadow-2xl"
          >
            <img 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src={image || "https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=1200"} 
              alt="Analyzed crop" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent flex flex-col justify-end p-6 sm:p-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-4 py-1.5 backdrop-blur-md bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/20">
                  {t('analysis_target')}: {formatLabel(result.crop)}
                </span>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  result.risk_level.toLowerCase() === 'critical' ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                )}>
                  {formatLabel(result.risk_level)} {t('risk')}
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-headline font-black text-white leading-none tracking-tighter max-w-2xl">
                {formatLabel(result.disease)}
              </h1>
            </div>
          </motion.div>

          {/* Reasoning Grid */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-12 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4"
          >
            {result.reasoning.map((reason, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-emerald-900/5 shadow-premium flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Psychology className="text-emerald-800 w-5 h-5" fill />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest mb-1 block">Log Point {i+1}</span>
                  <p className="text-[13px] font-medium leading-relaxed text-on-surface-variant">{reason}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Prescription Strategy */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <h3 className="text-2xl font-headline font-black tracking-tight whitespace-nowrap">{t('prescription_strategy', 'Prescription Strategy')}</h3>
            <div className="h-[1px] flex-1 bg-emerald-900/10"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Treatment Card */}
            <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-emerald-900/5 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shadow-inner">
                  <Bolt className="text-red-600 w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-headline font-bold text-primary">{t('immediate_response')}</h4>
                  <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/40">{t('field_urgent')}</p>
                </div>
              </div>
              <div className="space-y-4">
                {result.treatment.length > 0 ? result.treatment.map((text, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors">{i+1}</div>
                    <p className="text-sm text-on-surface leading-snug">{text}</p>
                  </div>
                )) : (
                  <p className="text-sm text-on-surface-variant italic">No immediate chemical treatment required.</p>
                )}
              </div>
            </div>

            {/* Organic / Prevention Card */}
            <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-emerald-900/5 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
                  <Spa className="text-emerald-800 w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-headline font-bold text-primary">{t('organic_controls', 'Organic Control')}</h4>
                  <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/40">{t('sustainable_choice')}</p>
                </div>
              </div>
              <div className="space-y-4">
                {(result.organic_controls && result.organic_controls.length > 0 ? result.organic_controls : result.prevention.slice(0, 3)).map((text, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-1" fill />
                    <p className="text-sm text-on-surface leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro-Tip Card */}
            <div className="bg-emerald-950 text-white p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                    <Info size={24} className="text-emerald-400" />
                   </div>
                   <h4 className="text-lg font-headline font-bold">{t('pro_tip')}</h4>
                 </div>
                 <p className="text-sm leading-relaxed text-emerald-100/70 italic mb-8 border-l-2 border-emerald-500/30 pl-4 py-1">
                   {isHealthy 
                     ? "Continue monitoring your field every 3 days. Early detection of pests like Aphids can save 40% of yield."
                     : "Check adjacent plants for similar symptoms. If localized, prune and burn affected leaves immediately."}
                 </p>
               </div>
               <button 
                onClick={() => setScreen('assistant')}
                className="relative z-10 w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl font-headline font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-950/40"
               >
                 {t('consult_assistant', 'Consult AI Expert')}
               </button>
               <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
