import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudRain, Sun, Cloud, Wind, Droplets, MapPin, Loader2, Navigation } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

import { getWeather } from '../lib/weather';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '4eb7811e4ca04217b6892318261004';

interface WeatherData {
  location: {
    name: string;
    region: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      code: number;
    };
    wind_kph: number;
    humidity: number;
    precip_mm: number;
  };
}

export default function WeatherWidget() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check initial permission status
  useEffect(() => {
    async function checkPermission() {
      if (!Capacitor.isNativePlatform()) {
        // Simple check for web
        if ('geolocation' in navigator) {
          // We can't easily check "granted" without triggering a prompt in some browsers, 
          // but we can try to get dummy weather or wait for user click.
        }
        return;
      }
      try {
        const pm = await Geolocation.checkPermissions();
        if (pm.location === 'granted') {
          setPermissionGranted(true);
          fetchWeatherWithLocation();
        }
      } catch (e) {
        console.warn('Permission check failed', e);
      }
    }
    checkPermission();
  }, []);

  async function requestPermissionAndFetch() {
    setLoading(true);
    setError(null);

    // Web Fallback
    if (!Capacitor.isNativePlatform()) {
      if (!('geolocation' in navigator)) {
        setError(t('geolocation_not_supported'));
        setLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPermissionGranted(true);
          fetchWeatherWithLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
      return;
    }

    try {
      const pm = await Geolocation.requestPermissions();
      if (pm.location === 'granted') {
        setPermissionGranted(true);
        fetchWeatherWithLocation();
      } else {
        setError(t('location_denied'));
        setLoading(false);
      }
    } catch (e) {
      console.error('Permission request failed', e);
      setError(t('permission_failed'));
      setLoading(false);
    }
  }

  async function fetchWeatherWithLocation(lat?: number, lon?: number) {
    setLoading(true);
    setError(null);
    try {
      let latitude = lat;
      let longitude = lon;

      if (latitude === undefined || longitude === undefined) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }
      
      const query = `${latitude},${longitude}`;
      const data = await getWeather(query);
      
      // Transform OpenMeteoFormat back to WeatherData format expected by this component
      setWeather({
        location: {
          name: data.city || 'Unknown',
          region: ''
        },
        current: {
          temp_c: data.weather.current.temperature_2m,
          condition: {
            text: 'Cloudy', // Generic fallback as OpenMeteoFormat doesn't store text yet
            code: 1003
          },
          wind_kph: data.weather.current.wind_speed_10m,
          humidity: data.weather.current.relative_humidity_2m,
          precip_mm: data.weather.current.precipitation
        }
      });
    } catch (err) {
      console.error('Weather error:', err);
      setError(t('weather_load_failed'));
    } finally {
      setLoading(false);
    }
  }

  // --- RENDERING ---

  // 1. Permission Gate
  if (!permissionGranted && !weather) {
    return (
      <div className="relative glass rounded-3xl p-5 overflow-hidden animate-fade-up border border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-500/10 border border-green-500/20 text-green-500">
            <Navigation size={22} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--text)]">{t('weather_updates')}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{t('enable_location_weather')}</p>
          </div>
          <button 
            onClick={requestPermissionAndFetch}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold press disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : t('enable')}
          </button>
        </div>
        {error && <p className="text-[9px] text-red-400 mt-2 text-center">{error}</p>}
      </div>
    );
  }

  // 2. Loading state
  if (loading && !weather) {
    return (
      <div className="glass rounded-3xl p-5 flex items-center justify-center animate-pulse min-h-[140px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-green-500" size={24} />
          <p className="text-[10px] text-[var(--text-muted)] font-mono animate-pulse">{t('syncing_satellites')}</p>
        </div>
      </div>
    );
  }

  // 3. Data display
  if (!weather) return null;

  const condition = weather.current.condition.text.toLowerCase();
  const isRain = condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower');
  const isCloudy = condition.includes('cloud') || condition.includes('overcast') || condition.includes('mist');
  
  const WeatherIcon = isRain ? CloudRain : (isCloudy ? Cloud : Sun);
  const iconColor = isRain ? '#60a5fa' : (isCloudy ? '#94a3b8' : '#fbbf24');
  const bgGlow = isRain ? 'rgba(96,165,250,0.1)' : (isCloudy ? 'rgba(148,163,184,0.1)' : 'rgba(251,191,36,0.1)');

  return (
    <div className="relative glass rounded-3xl p-5 overflow-hidden animate-fade-up">
      <div 
        className="absolute -right-4 -top-4 w-32 h-32 pointer-events-none rounded-full"
        style={{ background: `radial-gradient(circle, ${bgGlow} 0%, transparent 70%)` }}
      />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-1 text-[var(--text-muted)] mb-1">
            <MapPin size={12} className="text-red-400" />
            <span className="text-xs font-semibold">{weather.location.name}, {weather.location.region}</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-[var(--text)] tracking-tight">
            {weather.current.temp_c.toFixed(1)}°C
          </h2>
          <p className="text-sm font-medium" style={{ color: iconColor }}>
            {weather.current.condition.text}
          </p>
        </div>
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}
        >
          <WeatherIcon size={28} style={{ color: iconColor }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="flex items-center gap-2 bg-black/10 rounded-xl p-2.5 border border-white/5">
          <Droplets size={16} className="text-blue-400" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">{t('humidity')}</p>
            <p className="text-xs font-semibold text-[var(--text)]">{weather.current.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/10 rounded-xl p-2.5 border border-white/5">
          <Wind size={16} className="text-teal-400" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">{t('wind')}</p>
            <p className="text-xs font-semibold text-[var(--text)]">{weather.current.wind_kph} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
