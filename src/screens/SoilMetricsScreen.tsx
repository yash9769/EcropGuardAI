import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Science, Bolt, Analytics, Psychology, History, WaterDrop, CheckCircle, Warning } from '../components/Icons';
import { soilAPI, type SoilHistoryItem, type SoilAnalysisResponse } from '../services/api';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export const SoilMetricsScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nitrogen: 45,
    phosphorus: 25,
    potassium: 30,
    ph: 6.5,
    organic_matter: 2.5
  });
  const [analysisResult, setAnalysisResult] = useState<SoilAnalysisResponse | null>(null);
  const [history, setHistory] = useState<SoilHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const data = await soilAPI.getSoilHistory(user.id);
      setHistory(data);
    } catch (err) {
      console.error("Soil History Fetch Error:", err);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const metrics = { ...formData, user_id: user?.id ?? 'guest' };
      const result = await soilAPI.analyzeSoil(metrics);
      setAnalysisResult(result);
      fetchHistory();
    } catch (err) {
      console.error("Soil Analysis Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
      <TopBar title={t('soil_diagnostics')} activeScreen="soil-metrics" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-12 scrollbar-hide pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Input Panel */}
            <div className="bg-surface-container-low p-10 rounded-[3.5rem] border border-emerald-900/10 shadow-sm group">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Science className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-headline font-black text-primary tracking-tight">
                        {t('input_soil_data')}
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                    {Object.entries(formData).map(([key, val]) => (
                        <div key={key} className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex justify-between items-center group/label">
                                {t(key)}
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black ring-1 ring-primary/20 group-hover/label:bg-primary group-hover/label:text-white transition-colors">{val}</span>
                            </label>
                            <input 
                                type="range"
                                min={key === 'ph' ? 0 : 0}
                                max={key === 'ph' ? 14 : key === 'organic_matter' ? 20 : 200}
                                step={key === 'ph' || key === 'organic_matter' ? 0.1 : 1}
                                value={val}
                                onChange={(e) => setFormData({...formData, [key]: parseFloat(e.target.value)})}
                                className="w-full h-3 bg-surface-container-highest rounded-full transition-all accent-primary hover:cursor-grab active:cursor-grabbing shadow-inner border border-emerald-900/5"
                            />
                        </div>
                    ))}
                </div>
                
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className={cn(
                    "w-full py-5 signature-gradient text-white rounded-3xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-4 shadow-[0_10px_30px_rgba(6,78,59,0.3)]",
                    loading ? "opacity-50" : "hover:shadow-[0_15px_40px_rgba(6,78,59,0.4)] active:scale-95"
                  )}
                >
                  {loading ? t('analyzing_micro_nutrients') : t('perform_ai_analysis')}
                  <Bolt className={cn("w-5 h-5 transition-transform", loading && "animate-spin")} />
                </button>
            </div>

            {/* Advisory Dashboard */}
            <AnimatePresence mode="wait">
                {analysisResult ? (
                    <motion.div 
                        key="result"
                        initial={{ opacity: 0, x: 40, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -40, scale: 0.95 }}
                        className="bg-emerald-950 p-10 rounded-[4rem] text-white flex flex-col shadow-2xl relative overflow-hidden group/advisory"
                    >
                        {/* Decorative background circle */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 blur-[120px] -z-0 rounded-full -translate-y-1/2 translate-x-1/2 group-hover/advisory:bg-emerald-400/20 transition-all duration-1000"></div>
                        
                        <div className="relative z-10 flex-1">
                            <div className="flex items-center gap-4 mb-8">
                                <Psychology className="w-10 h-10 text-emerald-400 animate-pulse" />
                                <h3 className="text-3xl font-headline font-black uppercase tracking-tighter text-emerald-100 leading-none">{t('ai_advisory_scan')}</h3>
                            </div>
                            
                            <div className="flex items-center gap-10 mb-12">
                                <div className="text-8xl font-headline font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)] leading-none">{analysisResult.health_score}%</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 leading-loose max-w-[100px]">{t('health_index_score')}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-10">
                                {[
                                    { label: 'N', status: analysisResult.nitrogen_status },
                                    { label: 'P', status: analysisResult.phosphorus_status },
                                    { label: 'K', status: analysisResult.potassium_status },
                                    { label: 'pH', status: analysisResult.ph_status },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/5 flex items-center justify-between group/stat hover:bg-white/20 transition-colors">
                                        <span className="font-black text-emerald-400 text-sm">{stat.label}</span>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            stat.status.includes('Low') ? "text-amber-400" : "text-emerald-100"
                                        )}>{stat.status}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 space-y-6 mb-10 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 leading-none">{t('recommendations')}</h4>
                                </div>
                                <ul className="space-y-4">
                                    {analysisResult.recommendations.map((rec: string, i: number) => (
                                        <li key={i} className="flex items-start gap-4 text-sm font-medium text-white/90 leading-relaxed group/item">
                                            <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-emerald-400 transition-all group-hover/item:scale-110">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover/item:bg-emerald-950"></div>
                                            </div>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p className="text-sm font-bold text-emerald-100/60 leading-relaxed italic text-center px-4 tracking-tight px-10">
                                "{analysisResult.advisory}"
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-surface-container-low p-12 rounded-[4rem] border-4 border-dashed border-emerald-900/10 flex flex-col items-center justify-center text-center gap-6 group hover:border-emerald-900/30 transition-colors"
                    >
                        <div className="w-24 h-24 rounded-full bg-emerald-900/5 flex items-center justify-center group-hover:bg-emerald-900/10 transition-colors">
                            <Analytics className="w-12 h-12 text-emerald-900/20" />
                        </div>
                        <p className="text-on-surface-variant/40 font-black uppercase tracking-[0.3em] text-xs leading-loose max-w-[200px]">
                            {t('run_analysis_results')}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* History Section */}
        <div className="bg-surface-container-lowest p-10 rounded-[4rem] border border-emerald-900/10 shadow-sm relative overflow-hidden">
            <h3 className="text-3xl font-headline font-black text-primary mb-12 flex items-center gap-4 tracking-tight">
                <History className="w-8 h-8 text-secondary opacity-50" />
                {t('diagnostic_history')}
            </h3>
            
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left min-w-[700px]">
                    <thead>
                        <tr className="border-b-2 border-emerald-900/5">
                            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/60">{t('date')}</th>
                            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/60">{t('npk_index')} (N-P-K)</th>
                            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/60">{t('ph_level')}</th>
                            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/60">{t('health_score')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/5">
                        {history.length > 0 ? (
                            history.map((item, i) => (
                                <tr key={item.id} className="group hover:bg-surface-container-low transition-all">
                                    <td className="py-8">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-emerald-950">{new Date(item.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="px-5 py-2 rounded-full font-black text-primary bg-primary/10 text-sm tracking-widest border border-primary/20">
                                                {Math.round(item.nitrogen)}-{Math.round(item.phosphorus)}-{Math.round(item.potassium)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-8">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-3 h-3 rounded-full",
                                                item.ph < 6 ? "bg-amber-400" : item.ph > 7.5 ? "bg-red-400" : "bg-emerald-500"
                                            )}/>
                                            <span className="text-lg font-headline font-black text-emerald-950">{item.ph.toFixed(1)}</span>
                                        </div>
                                    </td>
                                    <td className="py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-2.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner border border-black/5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.soil_health_score}%` }}
                                                    className="h-full signature-gradient rounded-full"
                                                />
                                            </div>
                                            <span className="text-sm font-black text-primary">{Math.round(item.soil_health_score)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <analytics-icon className="w-12 h-12" />
                                        <p className="text-sm font-black uppercase tracking-widest">{t('no_historical_records_found')}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};
