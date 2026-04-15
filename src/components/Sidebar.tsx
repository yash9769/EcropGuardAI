import React from 'react';
import { useTranslation } from 'react-i18next';
import { SmartToy, History, PottedPlant, Science, WbSunny, Help, Settings, Add, Groups, Forum, Dashboard, Map, Analytics, Diamond } from './Icons';
import { cn } from '../lib/utils';

export type Screen = 'login' | 'assistant' | 'history' | 'crop-health' | 'analysis' | 'forums' | 'community' | 'soil-metrics' | 'weather' | 'settings' | 'support' | 'dashboard' | 'field-map' | 'analytics' | 'pro-plan';

interface SidebarProps {
  activeScreen: Screen;
  setScreen: (s: Screen) => void;
}

export const Sidebar = ({ activeScreen, setScreen }: SidebarProps) => {
  const { t } = useTranslation();
  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Dashboard },
    { id: 'assistant', label: t('assistant'), icon: SmartToy },
    { id: 'field-map', label: t('field_map'), icon: Map },
    { id: 'crop-health', label: t('crop_health'), icon: PottedPlant },
    { id: 'analytics', label: t('analytics'), icon: Analytics },
    { id: 'history', label: t('analysis_history'), icon: History },
    { id: 'community', label: t('community'), icon: Groups },
    { id: 'forums', label: t('forums'), icon: Forum },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r border-emerald-900/5 bg-emerald-50/40 backdrop-blur-2xl p-4 gap-2 sticky top-0 z-50">
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
<div className="w-10 h-10 rounded-full shadow-sm overflow-hidden">
          <img 
            src="/logo.png" 
            alt="AgriSense AI Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="font-headline font-black text-emerald-900 tracking-tight">{t('app_name')}</div>
          <div className="text-[10px] font-headline font-bold text-emerald-700/70 uppercase tracking-widest">{t('digital_agronomist')}</div>
        </div>
      </div>

      <button 
        onClick={() => setScreen('crop-health')}
        className="mb-6 w-full flex items-center justify-center gap-2 py-3 signature-gradient text-white rounded-xl shadow-sm text-sm font-bold hover:opacity-90 transition-all active:scale-95"
      >
        <Add className="w-4 h-4" />
        {t('new_analysis')}
      </button>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-headline text-sm font-medium",
              activeScreen === item.id 
                ? "bg-emerald-900 text-white shadow-sm" 
                : "text-emerald-800 hover:bg-emerald-100 hover:translate-x-1"
            )}
          >
            <item.icon className="w-5 h-5" fill={activeScreen === item.id} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-emerald-900/5 pt-4">
        <div className="mb-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-lg relative overflow-hidden group/pro">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Diamond className="w-4 h-4 text-emerald-400" fill />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{t('pro_plan')}</span>
            </div>
            <p className="text-[11px] text-emerald-100/70 leading-snug mb-3">{t('pro_promo_description')}</p>
            <button 
              onClick={() => setScreen('pro-plan')}
              className="w-full py-2 bg-white text-emerald-900 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-50 transition-colors"
            >
              {t('upgrade_now')}
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-400/10 rounded-full blur-2xl group-hover/pro:scale-150 transition-transform duration-700"></div>
        </div>

        <button 
          onClick={() => setScreen('support')}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-headline text-sm font-medium",
            activeScreen === 'support' ? "bg-emerald-900 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-100"
          )}
        >
          <Help className="w-5 h-5" fill={activeScreen === 'support'} />
          <span>{t('support')}</span>
        </button>
        <button 
          onClick={() => setScreen('settings')}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-headline text-sm font-medium",
            activeScreen === 'settings' ? "bg-emerald-900 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-100"
          )}
        >
          <Settings className="w-5 h-5" fill={activeScreen === 'settings'} />
          <span>{t('settings')}</span>
        </button>
      </div>
    </aside>
  );
};
