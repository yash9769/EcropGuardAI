import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { Analytics as AnalyticsIcon, TrendingUp, TrendingDown, ShowChart, BarChart, Timeline, ChevronRight, Download } from '../components/Icons';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const AnalyticsScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => [
    { label: t('yield_growth'), value: '12.4%', trending: 'up', change: '+3.2%' },
    { label: t('water_efficiency'), value: '92%', trending: 'up', change: '+1.8%' },
    { label: t('disease_incidence'), value: '2.1%', trending: 'down', change: '-0.5%' },
    { label: t('cost_per_hectare'), value: '₹18,400', trending: 'down', change: '-4.2%' },
  ], [t]);

  const historicalData = [
    { month: 'Jan', value: 65 },
    { month: 'Feb', value: 72 },
    { month: 'Mar', value: 78 },
    { month: 'Apr', value: 85 },
    { month: 'May', value: 91 },
    { month: 'Jun', value: 98 },
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return (
     <div className="flex-1 flex flex-col items-center justify-center text-primary font-headline font-bold uppercase tracking-widest animate-pulse p-20">
        {t('generating_cloud_reports')}
     </div>
  );

  const maxVal = Math.max(...historicalData.map((d: any) => d.value));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('analytics')} activeScreen="analytics" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-hide">
        {/* Header with Export */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-headline font-black text-primary tracking-tight">{t('performance_summary')}</h2>
            <p className="text-on-surface-variant font-medium">{t('analytics_subtitle')}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-xl text-xs font-bold uppercase tracking-widest text-primary hover:bg-surface-container-highest transition-colors">
            <Download className="w-4 h-4" />
            {t('export_pdf')}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
{stats.map((stat: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-emerald-900/5 shadow-sm"
            >
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-headline font-black text-primary">{stat.value}</span>
              </div>
              <div className={cn(
                "mt-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                stat.trending === 'up' ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              )}>
                {stat.trending === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-[2.5rem] border border-emerald-900/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-3">
                <Timeline className="w-6 h-6" />
                {t('yield_trend')}
              </h3>
              <div className="flex gap-2">
                {['D', 'W', 'M', 'Y'].map(t => (
                  <button key={t} className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors",
                    t === 'M' ? "bg-primary text-white" : "text-on-surface-variant hover:bg-emerald-100"
                  )}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-4 mt-8 px-4">
              {historicalData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full group">
                  <div className="w-full bg-surface-container-highest rounded-2xl flex items-end justify-center relative overflow-hidden flex-1 group-hover:bg-emerald-100 transition-colors">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.value / maxVal) * 100}%` }}
                      transition={{ delay: i * 0.1 }}
                      className="w-full signature-gradient rounded-t-2xl relative"
                    >
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                        <span className="text-[10px] font-black text-primary">{item.value}%</span>
                      </div>
                    </motion.div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side insights */}
          <div className="bg-primary p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <ShowChart className="w-6 h-6 text-emerald-300" />
                  <h3 className="text-2xl font-headline font-bold">{t('ai_prediction')}</h3>
                </div>
                <p className="text-lg text-emerald-50 leading-relaxed mb-8">
                  {t('ai_prediction_detail')}
                </p>
                
                <div className="space-y-4">
{[
                    { label: t('forecast_accuracy'), val: '98.2%' },
                    { label: t('data_points'), val: '12,420' },
                  ].map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-black text-white">{item.val}</span>
                    </div>
                  ))}
                </div>
             </div>
             <button className="relative z-10 mt-8 w-full py-4 bg-white text-primary rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-50 transition-colors">
               {t('deep_analysis_tool')}
             </button>
             <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-400 opacity-20 rounded-full blur-[80px]"></div>
          </div>
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-emerald-900/5 flex flex-col">
            <h3 className="text-xl font-headline font-bold text-primary mb-6 flex items-center gap-3">
              <BarChart className="w-5 h-5" />
              {t('resource_distribution')}
            </h3>
            <div className="space-y-6">
              {[
                { label: t('water_usage'), val: 78, color: 'from-blue-400 to-blue-600' },
                { label: t('fertilizer_optimization'), val: 92, color: 'from-emerald-400 to-emerald-600' },
                { label: t('energy_consumption'), val: 45, color: 'from-amber-400 to-amber-600' },
              ].map((item: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span>{item.label}</span>
                    <span>{item.val}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      className={cn("h-full rounded-full bg-gradient-to-r", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-emerald-900/5">
             <h3 className="text-xl font-headline font-bold text-primary mb-6">{t('efficiency_alerts')}</h3>
             <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="text-emerald-700 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-900">{t('reduced_water_waste')}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">{t('reduced_water_waste_detail')}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <TrendingDown className="text-amber-700 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">{t('npk_usage_elevated')}</p>
                    <p className="text-[10px] text-amber-700 font-medium">{t('npk_usage_elevated_detail')}</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
