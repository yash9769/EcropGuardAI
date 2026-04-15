import React from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Help, Mail, Forum, ChevronRight, CheckCircle, Diamond } from '../components/Icons';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const SupportScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('help_support')} activeScreen="support" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-12 scrollbar-hide">
        <div className="text-center space-y-4">
            <h1 className="text-5xl font-headline font-black text-primary tracking-tight">{t('help_support')}</h1>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto leading-relaxed">{t('help_support_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-low p-8 rounded-[3rem] border border-emerald-900/5 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-950/20">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-primary mb-2">{t('direct_message')}</h3>
                <p className="text-on-surface-variant font-medium mb-8 leading-relaxed">{t('direct_message_detail')}</p>
                <button className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs group-hover:shadow-md transition-all">{t('send_message')}</button>
            </div>

            <div className="bg-surface-container-low p-8 rounded-[3rem] border border-emerald-900/5 hover:shadow-xl transition-all group" onClick={() => setScreen('community')}>
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20">
                    <Forum className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-primary mb-2">{t('community_guilds')}</h3>
                <p className="text-on-surface-variant font-medium mb-8 leading-relaxed">{t('community_guilds_detail')}</p>
                <button className="w-full py-4 bg-surface-container-lowest text-emerald-900 border border-emerald-900/10 rounded-2xl font-bold uppercase tracking-widest text-xs group-hover:shadow-md transition-all">{t('visit_community')}</button>
            </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 p-10 rounded-[3rem] text-white overflow-hidden relative shadow-2xl">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Diamond className="w-4 h-4 text-emerald-400" fill />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">{t('enterprise_access')}</span>
                    </div>
                    <h3 className="text-4xl font-headline font-black leading-tight">{t('professional_consultation')}</h3>
                    <p className="mt-4 text-emerald-50/70 text-lg leading-relaxed font-light">{t('professional_consultation_detail')}</p>
                    <button className="mt-8 px-10 py-4 bg-white text-emerald-900 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-emerald-50 active:scale-95 transition-all shadow-xl">{t('book_session')}</button>
                </div>
                <div className="hidden md:flex justify-end p-8">
                    <div className="w-32 h-32 rounded-full border-4 border-emerald-400/20 flex items-center justify-center animate-pulse">
                         <div className="w-24 h-24 rounded-full border-2 border-emerald-400/40 flex items-center justify-center animate-pulse delay-75">
                            <Help className="w-12 h-12 text-emerald-400 opacity-60" />
                         </div>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 signature-gradient opacity-60"></div>
        </div>
      </div>
    </div>
  );
};
