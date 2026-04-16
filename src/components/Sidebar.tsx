import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SmartToy, History, PottedPlant, Science, 
  WbSunny, Help, Settings, Add, Groups, 
  Forum, Dashboard, Map, Analytics, Diamond 
} from './Icons';
import { cn } from '../lib/utils';

export type Screen = 
  | 'login' | 'assistant' | 'history' | 'crop-health' 
  | 'analysis' | 'forums' | 'community' | 'soil-metrics' 
  | 'weather' | 'settings' | 'support' | 'dashboard' 
  | 'field-map' | 'analytics' | 'pro-plan';

interface SidebarProps {
  activeScreen: Screen;
  setScreen: (s: Screen) => void;
}

export const Sidebar = ({ activeScreen, setScreen }: SidebarProps) => {
  const { t } = useTranslation();
  
  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Dashboard },
    { id: 'assistant', label: t('assistant'), icon: SmartToy },
    { id: 'crop-health', label: t('crop_health'), icon: PottedPlant },
    { id: 'soil-metrics', label: t('soil_diagnostics'), icon: Science },
    { id: 'weather', label: t('weather_updates'), icon: WbSunny },
    { id: 'field-map', label: t('field_map'), icon: Map },
    { id: 'analytics', label: t('performance_summary'), icon: Analytics },
    { id: 'history', label: t('analysis_history'), icon: History },
    { id: 'community', label: t('communities'), icon: Groups },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-72 border-r border-emerald-900/10 bg-surface/80 backdrop-blur-3xl p-6 gap-2 sticky top-0 z-50">
      <div className="flex items-center gap-4 px-2 py-6 mb-6">
        <div className="w-12 h-12 rounded-[1.2rem] shadow-2xl bg-primary flex items-center justify-center overflow-hidden ring-4 ring-emerald-900/5">
          <img 
            src="/logo.png" 
            alt="AgriSense AI Logo" 
            className="w-full h-full object-cover"
            onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/shapes/svg?seed=AgriSense';
            }}
          />
        </div>
        <div className="flex flex-col">
          <div className="font-headline font-black text-emerald-950 tracking-tight text-lg leading-tight">{t('app_name')}</div>
          <div className="text-[10px] font-headline font-bold text-emerald-700/60 uppercase tracking-[0.2em]">{t('digital_agronomist')}</div>
        </div>
      </div>

      <button 
        onClick={() => setScreen('crop-health')}
        className="mb-8 w-full flex items-center justify-center gap-3 py-4 signature-gradient text-white rounded-2xl shadow-xl shadow-primary/20 text-xs font-black uppercase tracking-widest hover:shadow-primary/30 transition-all active:scale-95 group"
      >
        <Add className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        {t('new_analysis')}
      </button>

      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-2 scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            className={cn(
              "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-headline text-sm font-bold tracking-tight group",
              activeScreen === item.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary hover:translate-x-1"
            )}
          >
            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeScreen === item.id ? "text-white" : "text-primary/70")} fill={activeScreen === item.id} />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-2 border-t border-emerald-900/5 pt-8">
        <div className="mb-4 p-5 rounded-[2rem] bg-emerald-950 text-white shadow-2xl relative overflow-hidden group/pro cursor-pointer" onClick={() => setScreen('pro-plan')}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Diamond className="w-4 h-4 text-emerald-400" fill />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">{t('pro_plan')}</span>
            </div>
            <p className="text-[11px] font-bold text-emerald-100/60 leading-relaxed mb-4">{t('pro_promo_description')}</p>
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black uppercase">{t('learn_more')}</span>
               <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover/pro:bg-emerald-400 group-hover/pro:text-emerald-950 transition-all">
                  <Add className="w-3 h-3 rotate-45" />
               </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl group-hover/pro:scale-150 transition-transform duration-700"></div>
        </div>

        <button 
          onClick={() => setScreen('support')}
          className={cn(
            "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-headline text-[13px] font-bold tracking-tight",
            activeScreen === 'support' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
          )}
        >
          <Help className="w-5 h-5 text-secondary" fill={activeScreen === 'support'} />
          <span>{t('support')}</span>
        </button>
        <button 
          onClick={() => setScreen('settings')}
          className={cn(
            "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-headline text-[13px] font-bold tracking-tight",
            activeScreen === 'settings' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
          )}
        >
          <Settings className="w-5 h-5 text-outline" fill={activeScreen === 'settings'} />
          <span>{t('settings')}</span>
        </button>
      </div>
    </aside>
  );
};
