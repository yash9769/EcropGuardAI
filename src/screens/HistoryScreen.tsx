import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight, Spa, Science, History, TrendingUp, TrendingDown } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const HistoryScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'crop' | 'soil'>('crop');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const endpoint = activeTab === 'crop' ? '/api/disease/history/1' : '/api/soil/history/1';
        const resp = await fetch(endpoint);
        if (!resp.ok) {
          throw new Error(`${resp.status} ${resp.statusText}`);
        }
        const contentType = resp.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await resp.json() : [];
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('diagnostic_history')} activeScreen="history" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-hide">
        {/* Statistics Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-emerald-900/5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('total_scans')}</span>
                <div className="flex items-center justify-between mt-2">
                    <h3 className="text-3xl font-headline font-black text-primary">{history.length}</h3>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-emerald-900/5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('peak_risk_level')}</span>
                <div className="flex items-center justify-between mt-2">
                    <h3 className="text-3xl font-headline font-black text-error">Critical</h3>
                    <div className="w-10 h-10 rounded-2xl bg-error-container flex items-center justify-center text-error">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="bg-primary p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                 <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('ai_status')}</span>
                    <h3 className="text-xl font-headline font-black mt-2">{t('active_real_time')}</h3>
                 </div>
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </div>
        </section>

        {/* Tab Controls */}
        <section className="flex flex-col md:flex-row gap-4 items-center justify-between mt-8">
          <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-full w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('crop')}
              className={cn(
                "px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'crop' ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-surface-container-lowest/50"
              )}
            >
              {t('crop_scans')}
            </button>
            <button 
              onClick={() => setActiveTab('soil')}
              className={cn(
                "px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'soil' ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-surface-container-lowest/50"
              )}
            >
              {t('soil_health')}
            </button>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('search_history_logs')}
              className="w-full bg-surface-container-low border-none rounded-full pl-12 pr-6 py-3 text-sm focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </section>

        {/* Dynamic History Table */}
        <section className="bg-surface-container-lowest rounded-[2.5rem] shadow-sm overflow-hidden mb-20 border border-emerald-900/5">
          <div className="overflow-x-auto">
            {loading ? (
                <div className="p-40 flex flex-col items-center justify-center text-primary animate-pulse font-headline font-black uppercase tracking-widest">
                    {t('synchronizing_logs')}
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low/50">
                        <th className="px-8 py-6 font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{t('diagnostics')}</th>
                        <th className="px-6 py-6 font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{t('summary_status')}</th>
                        <th className="px-6 py-6 font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{t('timestamp')}</th>
                        <th className="px-6 py-6 font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{t('metric')}</th>
                        <th className="px-8 py-6 font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant text-right">{t('view')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                        {history.length > 0 ? history.map((item, i) => (
                        <tr key={i} className="group hover:bg-surface-container-low/30 transition-colors cursor-pointer">
                            <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                    activeTab === 'crop' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                )}>
                                {activeTab === 'crop' ? <Spa className="w-5 h-5" /> : <Science className="w-5 h-5" />}
                                </div>
                                <div>
                                <div className="font-headline font-bold text-primary">{activeTab === 'crop' ? item.crop : t('soil_profile')}</div>
                                <div className="text-[0.65rem] font-bold text-outline-variant uppercase tracking-widest">{t('node_id', { id: item.id })}</div>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-6">
                            <div className="font-bold text-sm text-on-surface">{activeTab === 'crop' ? item.disease : t('npk_nutrient_index')}</div>
                            <div className="text-[0.7rem] text-on-surface-variant/70 italic max-w-[200px] truncate">{activeTab === 'crop' ? item.pathogen : t('nitrogen_focus', { value: Math.round(item.nitrogen) })}</div>
                            </td>
                            <td className="px-6 py-6 text-sm text-on-surface-variant font-medium">{new Date(item.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                                        <div 
                                            className={cn("h-full", activeTab === 'crop' ? "bg-primary" : "bg-amber-500")} 
                                            style={{ width: `${activeTab === 'crop' ? item.confidence : item.soil_health_score}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-black">{Math.round(activeTab === 'crop' ? item.confidence : item.soil_health_score)}%</span>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                            <button className="p-2 bg-surface-variant/20 rounded-xl group-hover:bg-primary group-hover:text-white transition-all text-outline">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            </td>
                        </tr>
                        )) : (
                            <tr><td colSpan={5} className="p-40 text-center font-headline font-bold uppercase tracking-[0.2em] text-on-surface-variant/20">{t('archived_history_empty')}</td></tr>
                        )}
                    </tbody>
                </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
