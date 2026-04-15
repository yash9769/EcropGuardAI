import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Science, WaterDrop, Bolt, Analytics, CheckCircle, Warning, Psychology, ChevronRight, History } from '../components/Icons';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const SoilMetricsScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nitrogen: 45,
    phosphorus: 25,
    potassium: 30,
    ph: 6.5,
    organic_matter: 2.5
  });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const parseJsonResponse = async (resp: Response) => {
    if (!resp.ok) {
      throw new Error(`${resp.status} ${resp.statusText}`);
    }
    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    return resp.json();
  };

  const fetchHistory = async () => {
    try {
      const resp = await fetch('/api/soil/history/1'); // Mock user_id 1
      const data = await parseJsonResponse(resp);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/soil/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: 1 })
      });
      const result = await parseJsonResponse(resp);
      setAnalysisResult(result ?? null);
      fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('soil_diagnostics')} activeScreen="soil-metrics" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-hide">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-emerald-900/5 shadow-sm">
                <h3 className="text-2xl font-headline font-bold text-primary mb-8 flex items-center gap-3">
                    <Science className="w-6 h-6" />
                    {t('input_soil_data')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    {Object.entries(formData).map(([key, val]) => (
                        <div key={key} className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex justify-between">
                                {t(key)}
                                <span className="text-primary">{val}</span>
                            </label>
                            <input 
                                type="range"
                                min={key === 'ph' ? 0 : 0}
                                max={key === 'ph' ? 14 : 200}
                                step={key === 'ph' || key === 'organic_matter' ? 0.1 : 1}
                                value={val}
                                onChange={(e) => setFormData({...formData, [key]: parseFloat(e.target.value)})}
                                className="w-full accent-primary h-2 bg-surface-container-highest rounded-full transition-all"
                            />
                        </div>
                    ))}
                </div>
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className={cn(
                    "w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                    loading ? "opacity-50" : "hover:shadow-xl active:scale-95"
                  )}
                >
                  {loading ? t('analyzing_micro_nutrients') : t('perform_ai_analysis')}
                  <Bolt className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
            </div>

            {analysisResult ? (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-emerald-950 p-8 rounded-[2.5rem] text-white flex flex-col shadow-2xl relative overflow-hidden"
                >
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <Psychology className="w-8 h-8 text-emerald-400" />
                            <h3 className="text-2xl font-headline font-black uppercase tracking-tighter">{t('ai_advisory_scan')}</h3>
                        </div>
                        <div className="flex items-center gap-6 mb-8">
                            <div className="text-6xl font-headline font-black text-emerald-400">{analysisResult.health_score}%</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-white/60">{t('health_index_score')}</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4 mb-8">
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">{t('recommendations')}</h4>
                            <ul className="space-y-2">
                                {analysisResult.recommendations.map((rec: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                        <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                        </div>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <p className="text-sm font-medium text-emerald-100/60 leading-relaxed italic">{analysisResult.advisory}</p>
                    </div>
                </motion.div>
            ) : (
                <div className="bg-surface-container-low p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-900/10 flex flex-col items-center justify-center text-center">
                    <Analytics className="w-16 h-16 text-emerald-900/10 mb-4" />
                    <p className="text-on-surface-variant/40 font-bold uppercase tracking-widest text-xs">{t('run_analysis_results')}</p>
                </div>
            )}
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-emerald-900/5 shadow-sm">
            <h3 className="text-2xl font-headline font-bold text-primary mb-8 flex items-center gap-3">
                <History className="w-6 h-6" />
                {t('diagnostic_history')}
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-emerald-900/5">
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('date')}</th>
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('npk_index')}</th>
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('ph_level')}</th>
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('health_score')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/5">
                        {history.length > 0 ? history.map((item, i) => (
                            <tr key={i} className="group hover:bg-surface-container-low transition-colors">
                                <td className="py-5 text-sm font-medium">{new Date(item.timestamp).toLocaleDateString()}</td>
                                <td className="py-5 text-sm font-bold text-primary">{Math.round(item.nitrogen)}-{Math.round(item.phosphorus)}-{Math.round(item.potassium)}</td>
                                <td className="py-5 text-sm font-bold">{item.ph.toFixed(1)}</td>
                                <td className="py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400" style={{ width: `${item.soil_health_score}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold">{Math.round(item.soil_health_score)}%</span>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="py-20 text-center text-sm font-medium text-on-surface-variant/40">{t('no_historical_records_found')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};
