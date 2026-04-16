import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { WaterDrop, WbSunny, Science, Analytics, ChevronRight } from '../components/Icons';
import { getWeather } from '../lib/weather';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const DashboardScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat?: number, lon?: number) => {
      try {
        const query = lat && lon 
          ? `${lat},${lon}`
          : 'Mumbai';
        const data = await getWeather(query);
        setWeather(data.weather);
      } catch (err) {
        console.error("Weather sync failed", err);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather() // Fallback if denied
      );
    } else {
      fetchWeather();
    }
  }, []);

  const current = weather?.current || {};

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title={t('overview')} activeScreen="dashboard" setScreen={setScreen} />
      
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight">{t('farm_overview')}</h1>
            <p className="text-on-surface-variant font-medium mt-1">{t('farm_overview_subtitle')}</p>
          </div>
          <button 
            onClick={() => setScreen('crop-health')}
            className="signature-gradient text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity whitespace-nowrap shadow-md"
          >
            {t('new_health_scan')}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="bg-surface-container-lowest p-6 rounded-3xl border border-emerald-900/5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                <WaterDrop className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md mb-1">{t('live')}</span>
            </div>
            <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{t('humidity')}</p>
            <p className="text-3xl font-headline font-black text-primary">{current.relative_humidity_2m || '--'}%</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container-lowest p-6 rounded-3xl border border-emerald-900/5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <WbSunny className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md mb-1">{t('current')}</span>
            </div>
            <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{t('temperature')}</p>
            <p className="text-3xl font-headline font-black text-primary">{current.temperature_2m || '--'}°C</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-container-lowest p-6 rounded-3xl border border-emerald-900/5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
                <Science className="w-6 h-6" fill />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md mb-1">{t('optimized')}</span>
            </div>
            <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{t('resource_index')}</p>
            <p className="text-3xl font-headline font-black text-primary">Stable</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            className="bg-primary p-6 rounded-3xl text-white shadow-lg relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm">
                <Analytics className="w-6 h-6" fill />
              </div>
            </div>
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-1 relative z-10">{t('health_score')}</p>
            <p className="text-3xl font-headline font-black text-white relative z-10">{t('health_score_status')}</p>
          </motion.div>
        </div>

        {/* Recent Activity and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
          <div className="lg:col-span-2 bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] border border-emerald-900/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-headline font-bold text-primary">{t('farm_activity_outline')}</h2>
              <button onClick={() => setScreen('history')} className="text-sm font-bold text-primary flex items-center hover:opacity-80 transition-opacity">
                {t('full_log')} <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { time: '10:45 AM', action: 'Irrigation Activated in Sector B', status: 'Completed', color: 'emerald' },
                { time: '09:12 AM', action: 'Early Blight detected on Tomato Crop', status: 'Action Required', color: 'error' },
                { time: '08:00 AM', action: 'Daily Drone Scan finished', status: 'Completed', color: 'emerald' },
                { time: 'Yesterday', action: 'Fertilizer applied to Sector A', status: 'Completed', color: 'emerald' },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-low/50 transition-colors cursor-pointer border border-transparent hover:border-emerald-900/5">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-outline/40"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">{item.action}</p>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">{item.time}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                    item.color === 'emerald' ? "bg-emerald-50 text-emerald-800" : "bg-error-container text-on-error-container"
                  )}>
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions / Alerts */}
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] border border-emerald-900/5 shadow-sm flex flex-col">
            <h2 className="text-2xl font-headline font-bold text-primary mb-6">{t('priorities')}</h2>
            <div className="flex-1 flex flex-col gap-4">
              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="p-5 rounded-2xl bg-error-container text-on-error-container relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer" onClick={() => setScreen('analysis')}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  {t('leaf_blight_risk')}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">{t('leaf_blight_risk_detail')}</p>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="p-5 rounded-2xl bg-secondary-container text-on-secondary-container relative overflow-hidden group flex-1 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setScreen('weather')}>
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="font-bold mb-2">{t('upcoming_rain')}</h3>
                <p className="text-sm opacity-90 leading-relaxed mb-4">{t('upcoming_rain_detail')}</p>
                <div className="mt-auto flex justify-end">
                   <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
