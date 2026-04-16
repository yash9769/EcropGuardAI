import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight, PottedPlant, Science, History, TrendingUp, Warning } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { soilAPI, type SoilHistoryItem } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const HistoryScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'crop' | 'soil'>('crop');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        if (activeTab === 'soil') {
          const data = await soilAPI.getSoilHistory(user.id);
          setHistory(data);
        } else {
          // Crop history is currently mock or needs dedicated endpoint
          // For production, we'd have soilAPI.getCropHistory
          const resp = await fetch(`/api/disease/history/${user.id}`);
          const data = await resp.json();
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("History fetch error:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [activeTab, user?.id]);

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.crop?.toLowerCase().includes(query)) ||
      (item.disease?.toLowerCase().includes(query)) ||
      (item.id?.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
      <TopBar title={t('diagnostic_history')} activeScreen="history" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-10 scrollbar-hide pb-32">
        {/* Intelligence Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-low p-8 rounded-[3rem] border border-emerald-900/5 shadow-sm group">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-60">{t('total_scans')}</span>
                <div className="flex items-center justify-between mt-4">
                    <h3 className="text-4xl font-headline font-black text-primary leading-none">{history.length}</h3>
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-low p-8 rounded-[3rem] border border-emerald-900/5 shadow-sm group">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-60">{t('peak_risk_level')}</span>
                <div className="flex items-center justify-between mt-4">
                    <h3 className="text-3xl font-headline font-black text-error leading-none uppercase tracking-tighter">{t('low')}</h3>
                    <div className="w-12 h-12 rounded-2xl bg-error-container text-error flex items-center justify-center shadow-md group-hover:bg-error group-hover:text-white transition-all">
                        <Warning className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="signature-gradient p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col justify-center h-full">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">{t('ai_status')}</span>
                    <h3 className="text-xl font-headline font-black tracking-tight leading-snug">{t('active_real_time')}</h3>
                 </div>
                 <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            </motion.div>
        </section>

        {/* Tactical Controls */}
        <section className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-[2rem] border border-emerald-900/5 shadow-inner w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('crop')}
              className={cn(
                "px-10 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                activeTab === 'crop' ? "bg-primary text-white shadow-lg ring-4 ring-primary/5" : "text-on-surface-variant hover:bg-surface-container-lowest"
              )}
            >
              {t('crop_scans')}
            </button>
            <button 
              onClick={() => setActiveTab('soil')}
              className={cn(
                "px-10 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                activeTab === 'soil' ? "bg-primary text-white shadow-lg ring-4 ring-primary/5" : "text-on-surface-variant hover:bg-surface-container-lowest"
              )}
            >
              {t('soil_health')}
            </button>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_history_logs')}
              className="w-full bg-surface-container-low border-none rounded-[2rem] pl-14 pr-8 py-4 text-sm font-bold text-on-surface placeholder:text-outline-variant/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
            />
          </div>
        </section>

        {/* Log Repository */}
        <section className="bg-surface-container-lowest rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-900/10 mb-20">
          <div className="overflow-x-auto scrollbar-hide">
            <AnimatePresence mode="wait">
              {loading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-48 flex flex-col items-center justify-center gap-6">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="font-headline font-black uppercase tracking-[0.4em] text-primary text-[10px] animate-pulse">{t('synchronizing_logs')}</p>
                  </motion.div>
              ) : (
                  <motion.table key="table" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                          <tr className="bg-surface-container-low/50">
                            <th className="px-10 py-8 font-black text-[10px] uppercase tracking-[0.4em] text-on-surface-variant/60">{t('diagnostics')}</th>
                            <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.4em] text-on-surface-variant/60">{t('summary_status')}</th>
                            <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.4em] text-on-surface-variant/60">{t('date')}</th>
                            <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.4em] text-on-surface-variant/60">{t('health_score')}</th>
                            <th className="px-10 py-8 text-right font-black text-[10px] uppercase tracking-[0.4em] text-on-surface-variant/60">{t('view')}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-900/5">
                          {filteredHistory.length > 0 ? filteredHistory.map((item, i) => (
                          <tr key={item.id || i} className="group hover:bg-surface-container-low/40 transition-all cursor-pointer">
                              <td className="px-10 py-10">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-md transition-transform group-hover:scale-110",
                                        activeTab === 'crop' ? "bg-primary text-white" : "bg-primary text-white"
                                    )}>
                                      {activeTab === 'crop' ? <PottedPlant className="w-6 h-6" /> : <Science className="w-6 h-6" />}
                                    </div>
                                    <div>
                                      <div className="font-headline font-black text-emerald-950 text-base leading-tight">
                                        {activeTab === 'crop' ? (item.crop_type || t('unidentified_crop')) : (item.soil_health_score > 80 ? t('optimal_profile') : t('nutrient_depleted'))}
                                      </div>
                                      <div className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em] mt-1">ID: {item.id ? item.id.substring(0,8) : 'GUEST-NODE'}</div>
                                    </div>
                                </div>
                              </td>
                              <td className="px-8 py-10">
                                <div className="font-black text-xs text-primary uppercase tracking-widest leading-relaxed">
                                  {activeTab === 'crop' ? (item.disease_name || t('healthy_profile')) : t('npk_nutrient_index')}
                                </div>
                                <div className="text-[11px] font-bold text-on-surface-variant/60 italic mt-1 leading-snug max-w-[200px] truncate">
                                  {activeTab === 'crop' ? item.description : `N:${item.nitrogen} P:${item.phosphorus} K:${item.potassium}`}
                                </div>
                              </td>
                              <td className="px-8 py-10">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-on-surface">{new Date(item.timestamp).toLocaleDateString()}</span>
                                  <span className="text-[10px] font-bold text-on-surface-variant/40 mt-1">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </td>
                              <td className="px-8 py-10">
                                  <div className="flex items-center gap-6">
                                      <div className="w-32 h-2.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
                                          <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${activeTab === 'crop' ? item.confidence : item.soil_health_score}%` }}
                                              className="h-full signature-gradient rounded-full"
                                          />
                                      </div>
                                      <span className="text-sm font-black text-primary leading-none">{Math.round(activeTab === 'crop' ? item.confidence : item.soil_health_score)}%</span>
                                  </div>
                              </td>
                              <td className="px-10 py-10 text-right">
                                <button className="w-12 h-12 flex items-center justify-center bg-surface-container-low rounded-2xl group-hover:bg-primary group-hover:text-white transition-all text-primary shadow-sm active:scale-90">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                              </td>
                          </tr>
                          )) : (
                              <tr>
                                <td colSpan={5} className="py-48 text-center">
                                  <div className="flex flex-col items-center gap-6 opacity-20">
                                      <History className="w-16 h-16" />
                                      <p className="font-black uppercase tracking-[0.4em] text-xs">{t('no_historical_records_found')}</p>
                                  </div>
                                </td>
                              </tr>
                          )}
                      </tbody>
                  </motion.table>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
};
