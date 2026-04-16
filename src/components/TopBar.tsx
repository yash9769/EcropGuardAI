import React from 'react';
import { useTranslation } from 'react-i18next';
import { SmartToy, Star, Notifications, Settings } from './Icons';
import { type Screen } from './Sidebar';
import { cn } from '../lib/utils';

interface TopBarProps {
  title: string;
  activeScreen?: Screen;
  setScreen: (s: Screen) => void;
  dark?: boolean;
}

export const TopBar = ({ title, activeScreen, setScreen, dark }: TopBarProps) => {
  const { t, i18n } = useTranslation();
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'HI' },
    { code: 'mr', label: 'MR' },
  ];

  return (
    <header className={cn(
      "relative z-30 flex justify-between items-center px-8 py-5 w-full backdrop-blur-3xl border-b transition-all duration-300 shrink-0",
      dark 
        ? "bg-emerald-950/90 border-white/5 text-white" 
        : "bg-surface/90 border-emerald-900/5 text-emerald-900"
    )}>
      <div className="flex items-center gap-8">
        <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => setScreen('dashboard')}>
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm bg-primary p-1.5 flex items-center justify-center">
             <img 
               src="/logo.png" 
               alt="AgriSense AI Logo" 
               className="w-full h-full object-contain"
             />
          </div>
          <span className={cn("text-lg font-extrabold tracking-tighter font-headline", dark ? "text-white" : "text-emerald-900")}>{t('app_name')}</span>
        </div>
        <h2 className={cn("hidden md:block font-headline font-bold text-lg", dark ? "text-white" : "text-emerald-900")}>{title}</h2>
        
        <nav className="hidden lg:flex items-center gap-6 ml-4">
          {['dashboard', 'field-map', 'assistant'].map(id => (
            <button 
              key={id}
              onClick={() => setScreen(id as Screen)}
              className={cn(
                "font-sans text-[10px] font-black tracking-widest uppercase transition-all",
                activeScreen === id 
                  ? (dark ? "text-white border-b-2 border-emerald-400 pb-1" : "text-primary border-b-2 border-primary pb-1")
                  : (dark ? "text-emerald-100/40 hover:text-white" : "text-on-surface-variant/50 hover:text-primary")
              )}
            >
              {t(id)}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setScreen('pro-plan')}
          className={cn(
            "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border",
            dark 
                ? "bg-emerald-400 text-emerald-950 border-emerald-400 hover:bg-emerald-300"
                : "bg-emerald-100/50 text-emerald-900 border-emerald-900/5 hover:bg-emerald-200/50"
          )}
        >
          <Star className="w-3 h-3" fill />
          {t('upgrade_pro')}
        </button>
        <div className="flex items-center gap-1">
          <button className={cn("p-2 rounded-xl transition-colors", dark ? "text-emerald-100/60 hover:bg-white/10" : "text-on-surface-variant hover:bg-surface-container-high")}>
            <Notifications className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setScreen('settings')}
            className={cn("p-2 rounded-xl transition-colors", dark ? "text-emerald-100/60 hover:bg-white/10" : "text-on-surface-variant hover:bg-surface-container-high")}
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className={cn("w-9 h-9 rounded-xl overflow-hidden border ml-2 shadow-sm", dark ? "border-white/10" : "border-emerald-900/10")}>
            <img 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" 
              alt="User" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};
