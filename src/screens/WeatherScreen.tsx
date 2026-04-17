import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { WbSunny, Warning, WaterDrop, Bolt, Search, Analytics } from '../components/Icons';
import { getWeather } from '../lib/weather';
import { cn } from '../lib/utils';

export const WeatherScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Mumbai');

  useEffect(() => {
    const getWeatherData = async (lat?: number, lon?: number) => {
      setLoading(true);
      try {
        const query = lat && lon 
          ? `${lat},${lon}`
          : city;
        const data = await getWeather(query);
        setWeatherData(data);
        if (data.city) setCity(data.city);
      } catch (err) {
        console.error("Weather fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => getWeatherData(pos.coords.latitude, pos.coords.longitude),
        () => getWeatherData()
      );
    } else {
      getWeatherData();
    }
  }, []);

  const forecast = weatherData?.weather?.daily?.time?.map((time: string, i: number) => ({
    day: new Date(time).toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
    temp: `${Math.round(weatherData?.weather?.daily?.temperature_2m_max?.[i] || 0)}°C`,
    icon: WbSunny
  })) || [];

  const current = weatherData?.weather?.current || {};
  const isRainy = (weatherData?.weather?.current?.precipitation || 0) > 0.5;

  const handleSearch = async () => {
    if (!city.trim()) return;
    setLoading(true);
    try {
      const data = await getWeather(city);
      setWeatherData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !weatherData) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface p-20 text-primary font-headline font-bold uppercase tracking-widest gap-4 animate-pulse">
       <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
       {t('synchronizing_satellites')}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
      <TopBar title={t('weather_title')} activeScreen="weather" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-hide">
        {/* Search Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-surface-container-lowest p-6 rounded-3xl border border-emerald-900/10 shadow-sm gap-6">
           <div className="flex items-center gap-4 px-4 flex-1 w-full">
              <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest shrink-0">{t('tracking_city')}</span>
              <div className="relative flex-1">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('enter_city')}
                  className="w-full bg-transparent border-none focus:ring-0 font-headline font-bold text-primary placeholder:text-outline/20 pl-8"
                />
              </div>
           </div>
           <button 
             onClick={handleSearch}
             disabled={loading}
             className="w-full md:w-auto px-8 py-3 signature-gradient text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
           >
              {loading ? t('syncing') : t('update_node')}
              <Bolt className={cn("w-4 h-4", loading && "animate-spin")} />
           </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={city}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Main Weather */}
            <div className="lg:col-span-2 signature-gradient p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl group">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[100px] -z-0 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-1000"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
                <div>
                  <span className="text-white/60 font-black uppercase tracking-[0.4em] text-[10px]">{t('current_conditions')}</span>
                  <div className="flex items-center gap-8 mt-6">
                    <h2 className="text-8xl md:text-9xl font-headline font-black tracking-tighter leading-none">{Math.round(current.temperature_2m || 0)}°</h2>
                    <div className="space-y-2">
                      <p className="text-3xl md:text-4xl font-headline font-black tracking-tight">{t('in_city', {city})}</p>
                      <p className="text-white/80 font-bold text-lg">Humidity {current.relative_humidity_2m}% · Wind {current.wind_speed_10m} km/h</p>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex w-56 h-56 bg-white/10 backdrop-blur-2xl rounded-full items-center justify-center border border-white/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)]">
                  <WbSunny className="w-36 h-36 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
                </div>
              </div>

              <div className="mt-16 flex justify-between gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {forecast.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-xl px-8 py-6 rounded-3xl border border-white/10 min-w-[120px] hover:bg-white/20 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{item.day}</span>
                    <item.icon className="w-10 h-10 text-white" />
                    <span className="text-2xl font-headline font-black">{item.temp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental Logs */}
            <div className="bg-surface-container-low p-10 rounded-[4rem] border border-emerald-900/10 shadow-sm flex flex-col">
              <h3 className="text-3xl font-headline font-black text-primary mb-10 tracking-tight">{t('environmental_log')}</h3>
              <div className="space-y-8 flex-1">
                {[
                  { label: t('wind_speed'), val: current.wind_speed_10m ? `${current.wind_speed_10m}${t('kmh')}` : '14 km/h', sub: 'North-East', icon: <Bolt className="w-4 h-4 text-primary"/> },
                  { label: t('uv_index'), val: 'High', sub: t('sun_protection'), icon: <WbSunny className="w-4 h-4 text-primary"/> },
                  { label: t('precipitation'), val: `${current.precipitation ?? 0.2} mm`, sub: t('last_24h'), icon: <WaterDrop className="w-4 h-4 text-primary"/> },
                  { label: t('dew_point'), val: '18' + t('c'), sub: t('stable'), icon: <Analytics className="w-4 h-4 text-primary"/> },
                ].map((log, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-outline-variant/10 pb-6 group cursor-default">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {log.icon}
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{log.label}</p>
                      </div>
                      <p className="text-sm text-outline font-bold tracking-tight">{log.sub}</p>
                    </div>
                    <p className="text-2xl font-headline font-black text-primary group-hover:scale-110 transition-transform">{log.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Rain Warning */}
        {isRainy && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-error-container/40 border border-error/10 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 shadow-xl"
          >
            <div className="w-20 h-20 bg-error shadow-2xl shadow-error/30 rounded-3xl flex items-center justify-center shrink-0 animate-bounce">
               <Warning className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-2xl font-headline font-black text-on-error-container tracking-tight">{t('heavy_rainfall_expected')}</h4>
              <p className="text-on-error-container/70 font-bold mt-2 leading-relaxed">{t('rain_warning_detail')}</p>
            </div>
            <button className="w-full md:w-auto bg-error text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-error/90 transition-all shadow-lg active:scale-95">
              {t('emergency_guidelines')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
