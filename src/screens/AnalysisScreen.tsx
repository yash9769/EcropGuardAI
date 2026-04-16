import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, BarChart, Analytics, Psychology, GridView, Coronavirus, Waves, Medication, Bolt, Shield, Spa, Download } from '../components/Icons';
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
  } | null;
}

export const AnalysisScreen = ({ setScreen, image, result }: AnalysisScreenProps) => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-pulse">
            <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Analytics className="w-8 h-8 text-emerald-800" />
            </div>
<p className="text-on-surface-variant font-headline font-bold">{t('no_analysis_data_found')}</p>
            <button 
                onClick={() => setScreen('crop-health')}
                className="mt-4 text-primary font-bold hover:underline"
            >
                {t('go_back_to_upload')}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
<TopBar title={t('diagnosis_result')} setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-hide">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 relative group overflow-hidden rounded-3xl bg-surface-container-low aspect-video lg:aspect-auto h-full min-h-[400px]">
            <img 
              className="absolute inset-0 w-full h-full object-cover" 
              src={image || "https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=1200"} 
              alt="Analyzed crop" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex flex-col justify-end p-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 glass-panel rounded-full text-[10px] font-bold uppercase tracking-widest text-primary border border-white/20">Analysis Target</span>
              </div>
              <h1 className="text-3xl font-headline font-extrabold text-white leading-tight">{result.crop}</h1>
              <p className="text-emerald-50/80 text-sm max-w-md">Gemini 1.5 Pro identified the following health patterns in your crop.</p>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-emerald-900/5 flex flex-col justify-between flex-1 relative overflow-hidden shadow-sm">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-tertiary-container/10 rounded-full blur-3xl"></div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-2 block">Primary Diagnosis</span>
                <h2 className="text-4xl font-headline font-bold text-primary mb-1">{result.disease}</h2>
                <p className="text-on-surface-variant text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-800" fill />
                  AI Verified Identification
                </p>
              </div>

              <div className="mt-8 flex items-center justify-center relative py-10">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-surface-container-low" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
                    <motion.circle 
                      initial={{ strokeDashoffset: 552.92 }}
                      animate={{ strokeDashoffset: 552.92 - (552.92 * result.confidence / 100) }}
                      className="text-primary" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeWidth="12"
                    ></motion.circle>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-headline font-black text-primary">{result.confidence}%</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Confidence</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant">Pathogen</span>
                  <span className="font-bold text-sm">{result.pathogen}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-on-surface-variant">Risk Level</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    result.risk_level.toLowerCase() === 'critical' ? "bg-error-container text-on-error-container" : "bg-warning-container text-on-warning-container"
                  )}>
                    {result.risk_level}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Probability & Reasoning Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-surface-container-low p-8 rounded-3xl flex flex-col">
            <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-2 text-primary">
              <BarChart className="w-5 h-5" />
              Impact Summary
            </h3>
            <div className="space-y-6">
                <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                        The detected <strong>{result.disease}</strong> is currently at a <strong>{result.risk_level}</strong> risk level. {result.reasoning[0]}
                    </p>
                </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-3xl md:col-span-2">
            <h3 className="text-lg font-headline font-bold mb-6 flex items-center gap-2 text-primary">
              <Psychology className="w-5 h-5" />
              Visual Evidence & Reasoning
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.reasoning.map((reason, i) => (
                <div key={i} className="bg-surface-container-lowest p-4 rounded-2xl flex flex-col items-start gap-2 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                    <GridView className="text-primary w-4 h-4" />
                  </div>
                  <p className="text-xs leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Prescription Strategy */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <h3 className="text-2xl font-headline font-extrabold tracking-tight">Prescription Strategy</h3>
            <div className="hidden sm:block h-[1px] flex-1 mx-8 bg-outline-variant/20"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-emerald-900/5 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                  <Bolt className="text-error w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-headline font-bold">Immediate Response</h4>
                  <p className="text-on-surface-variant text-sm">Required as soon as possible</p>
                </div>
              </div>
              <ul className="space-y-4">
                {result.treatment.map((text, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">{i+1}</div>
                    <p className="text-sm text-on-surface leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-emerald-900/5 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-800/10 flex items-center justify-center">
                  <Shield className="text-emerald-800 w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-headline font-bold">Long-term Prevention</h4>
                  <p className="text-on-surface-variant text-sm">Strategic field management</p>
                </div>
              </div>
              <ul className="space-y-4">
                {result.prevention.map((text, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-800">
                      <Spa className="w-4 h-4" fill />
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
