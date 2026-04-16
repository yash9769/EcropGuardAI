import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Map as MapIcon, Warning, CheckCircle, WaterDrop, ChevronRight, Analytics } from '../components/Icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type Sector = {
  id: string;
  name: string;
  crop: string;
  status: 'healthy' | 'warning' | 'critical';
  moisture: string;
  yieldEstimate: string;
  coordinates: string; // Fake points
};

const SECTORS: Sector[] = [
  { id: 'sec-a', name: 'sector_a', crop: 'crop_wheat', status: 'healthy', moisture: '38%', yieldEstimate: '4.2 tons/ha', coordinates: 'clip-path-a' },
  { id: 'sec-b', name: 'sector_b', crop: 'crop_corn', status: 'critical', moisture: '22%', yieldEstimate: '8.5 tons/ha (At Risk)', coordinates: 'clip-path-b' },
  { id: 'sec-c', name: 'sector_c', crop: 'crop_soybeans', status: 'healthy', moisture: '41%', yieldEstimate: '3.1 tons/ha', coordinates: 'clip-path-c' },
  { id: 'sec-d', name: 'sector_d', crop: '', status: 'warning', moisture: '30%', yieldEstimate: '35 tons/ha', coordinates: 'clip-path-d' },
];

export const FieldMapScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [activeSector, setActiveSector] = useState<Sector>(SECTORS[0]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-container-lowest">
      <TopBar title={t('interactive_field_map')} activeScreen="field-map" setScreen={setScreen} />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Map Area (Simulated) */}
        <div className="flex-1 relative bg-emerald-50/50 p-4 lg:p-8 overflow-hidden order-2 lg:order-1 flex items-center justify-center">
            {/* Background Map Image or Texture */}
            <div 
              className="absolute inset-4 lg:inset-8 bg-cover bg-center rounded-3xl overflow-hidden opacity-30 pointer-events-none filter sepia-[0.3] hue-rotate-[70deg]"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=1600)' }}
            />
            
            {/* Simulated interactive map polygons */}
            <div className="relative w-full max-w-3xl aspect-[4/3] bg-surface-container-lowest/40 backdrop-blur-sm rounded-3xl border-2 border-emerald-900/10 shadow-xl overflow-hidden flex flex-wrap p-2 gap-2">
                
                {SECTORS.map((sector) => (
                    <button
                      key={sector.id}
                      onClick={() => setActiveSector(sector)}
                      className={cn(
                          "relative flex-1 min-w-[40%] rounded-2xl border-2 transition-all p-4 flex flex-col items-center justify-center gap-2 group overflow-hidden",
                          activeSector.id === sector.id ? "border-primary shadow-lg scale-[1.02] z-10 bg-white" : "border-transparent bg-white/50 hover:bg-white/80 hover:border-outline-variant",
                          sector.status === 'healthy' ? "shadow-emerald-900/5" :
                          sector.status === 'warning' ? "shadow-amber-900/5 bg-amber-50/30" : "shadow-red-900/5 bg-red-50/30"
                      )}
                      style={{ height: sector.id === 'sec-a' || sector.id === 'sec-b' ? '55%' : '40%' }}
                    >
                        <div className={cn(
                            "absolute inset-0 opacity-10 transition-opacity",
                            sector.status === 'healthy' ? "bg-emerald-500" :
                            sector.status === 'warning' ? "bg-amber-500" : "bg-red-500 group-hover:opacity-20"
                        )} />
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="font-headline font-bold text-xl text-emerald-950">{t(sector.name)}</span>
                            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
                              {sector.crop ? t(sector.crop) : t('unassigned_crop')}
                            </span>
                        </div>

                        {sector.status === 'critical' && (
                             <Warning className="w-8 h-8 text-error relative z-10 mt-2 animate-pulse" />
                        )}
                        {sector.status === 'healthy' && (
                             <CheckCircle className="w-6 h-6 text-emerald-600 relative z-10 mt-2 opacity-50" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Side Panel for Details */}
        <div className="w-full lg:w-96 bg-surface-container border-l border-emerald-900/5 flex flex-col shrink-0 order-1 lg:order-2 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSector.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-8 flex flex-col gap-8"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                        "w-3 h-3 rounded-full",
                        activeSector.status === 'healthy' ? "bg-emerald-500" :
                        activeSector.status === 'warning' ? "bg-amber-500" : "bg-red-500 animate-ping"
                    )}></span>
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        {activeSector.status === 'healthy' ? t('optimal_condition') : 
                         activeSector.status === 'warning' ? t('requires_attention') : t('critical_alert')}
                    </span>
                </div>
                <h2 className="text-4xl font-headline font-black text-primary tracking-tight">{t(activeSector.name)}</h2>
                <div className="mt-4 flex items-center justify-between border-y border-outline-variant/20 py-4">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-outline">{t('crop_setup')}</span>
                        <span className="font-bold text-lg text-emerald-900">{activeSector.crop ? t(activeSector.crop) : t('unassigned_crop')}</span>
                    </div>
                    <div className="w-px h-8 bg-outline-variant/30"></div>
                     <div className="flex flex-col items-end">
                        <span className="text-xs uppercase tracking-widest text-outline">{t('area')}</span>
                        <span className="font-bold text-lg text-emerald-900">42 Ha</span>
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                  <div className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 border border-outline-variant/10">
                      <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                          <WaterDrop className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('soil_moisture')}</p>
                          <p className="text-xl font-headline font-bold text-emerald-950">{activeSector.moisture}</p>
                      </div>
                  </div>

                  <div className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 border border-outline-variant/10">
                      <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                          <Analytics className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('estimated_yield')}</p>
                          <p className="text-sm font-headline font-bold text-emerald-950 mt-1 leading-snug">{activeSector.yieldEstimate}</p>
                      </div>
                  </div>
              </div>

              {activeSector.status === 'critical' ? (
                  <div className="bg-error-container/50 border border-error/20 p-5 rounded-2xl flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-error font-bold">
                          <Warning className="w-5 h-5" />
                          {t('critical_action_title')}
                      </div>
                      <p className="text-sm text-on-surface-variant">{t('critical_action_detail')}</p>
                      <button 
                        onClick={() => setScreen('assistant')}
                        className="w-full bg-error text-white py-3 rounded-xl font-bold hover:bg-error/90 transition-colors shadow-sm"
                      >
                          {t('talk_to_agronomist_ai')}
                      </button>
                  </div>
              ) : (
                  <div className="mt-auto pt-4">
                      <button 
                        onClick={() => setScreen('analysis')}
                        className="w-full bg-surface-container-lowest border border-primary/20 text-primary py-4 rounded-2xl font-bold flex flex-col items-center gap-1 group hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                          <span>{t('run_deep_analysis')}</span>
                          <span className="text-[10px] font-normal uppercase tracking-widest opacity-70">{t('on_sector', { sector: activeSector.name })}</span>
                      </button>
                  </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
