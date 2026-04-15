import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '../components/TopBar';
import { type Screen } from '../components/Sidebar';
import { WbSunny, Warning } from '../components/Icons';
import { getWeather } from '../lib/weather';

export const WeatherScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { t, i18n } = useTranslation();
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
  }, []); // Only run on mount for auto-detect

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-surface p-20 text-primary font-headline font-bold uppercase tracking-widest animate-pulse">
       {t('synchronizing_satellites')}
  </div>
  );

  const forecast = weatherData?.weather?.daily?.time?.map((time: string, i: number) => ({
    day: new Date(time).toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
    temp: `${Math.round(weatherData?.weather?.daily?.temperature_2m_max?.[i] || 0)}°C`,
    icon: WbSunny
  })) || [];

  const current = weatherData?.weather?.current || {};

  const handleSearch = async () => {
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
      <TopBar title={t('weather_title')} activeScreen="weather" setScreen={setScreen} />
      
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-hide">
        {/* Search Header */}
        <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-3xl border border-emerald-900/5 shadow-sm">
           <div className="flex items-center gap-4 px-4 flex-1">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('tracking_city')}</span>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('enter_city')}
                className="flex-1 bg-transparent border-none focus:ring-0 font-headline font-bold text-primary placeholder:text-outline/20"
              />
           </div>
           <button 
             onClick={handleSearch}
             className="px-6 py-2 signature-gradient text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
           >
              {t('update_node')}
           </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Weather */}
          <div className="lg:col-span-2 signature-gradient p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <span className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px]">{t('current_conditions')}</span>
                <div className="flex items-center gap-6 mt-4">
                  <h2 className="text-7xl md:text-8xl font-headline font-black tracking-tighter">{Math.round(current.temperature_2m || 0)}°</h2>
                  <div className="space-y-1">
                    <p className="text-2xl md:text-3xl font-headline font-bold">{t('in_city', {city})}</p>
                    <p className="text-white/70 font-medium">Humidity {current.relative_humidity_2m}% · Wind {current.wind_speed_10m} km/h</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex w-48 h-48 bg-white/10 backdrop-blur-xl rounded-full items-center justify-center border border-white/20 shadow-inner">
                <WbSunny className="w-32 h-32 text-white drop-shadow-lg" />
              </div>
            </div>

            <div className="mt-12 flex justify-between gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {forecast.map((item: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 min-w-[100px]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.day}</span>
                  <item.icon className="w-8 h-8 text-white" />
                  <span className="text-xl font-headline font-bold">{item.temp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Log */}
          <div className="bg-surface-container-lowest p-8 rounded-[3rem] border border-emerald-900/5 shadow-sm flex flex-col">
            <h3 className="text-2xl font-headline font-bold text-primary mb-6">{t('environmental_log')}</h3>
            <div className="space-y-6 flex-1">
{[
                { label: t('wind_speed'), val: current.wind_speed_10m ? `${current.wind_speed_10m}${t('kmh')}` : '12 km/h', sub: 'North-East' },
                { label: t('uv_index'), val: '6.4 ' + t('high'), sub: t('sun_protection') },
                { label: t('precipitation'), val: '0.2 ' + t('mm'), sub: t('last_24h') },
                { label: t('dew_point'), val: '18' + t('c'), sub: t('stable') },
              ].map((log, i) => (
                <div key={i} className="flex justify-between items-end border-b border-outline-variant/10 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{log.label}</p>
                    <p className="text-sm text-outline font-medium">{log.sub}</p>
                  </div>
                  <p className="text-xl font-headline font-black text-primary">{log.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rain Warning */}
        <div className="bg-error-container/30 border border-error/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="w-16 h-16 bg-error shadow-lg shadow-error/20 rounded-2xl flex items-center justify-center shrink-0">
             <Warning className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-headline font-bold text-on-error-container">{t('heavy_rainfall_expected')}</h4>
            <p className="text-on-error-container opacity-80 mt-1">{t('rain_warning_detail')}</p>
          </div>
          <button className="bg-error text-white px-8 py-3 rounded-xl font-bold hover:bg-error/90 transition-colors shadow-md">
            {t('emergency_guidelines')}
          </button>
        </div>
      </div>
    </div>
  );
};
