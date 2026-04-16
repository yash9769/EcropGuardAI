const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '9b10d8ff980c38ff1e85da136ead66b3';
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '4eb7811e4ca04217b6892318261004';

export interface OpenMeteoFormat {
  weather: {
    current: {
      temperature_2m: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      precipitation: number;
      uv_index: number;
    };
    daily: {
      time: string[];
      temperature_2m_max: number[];
    };
  };
  city?: string;
}

export async function getWeather(query: string): Promise<OpenMeteoFormat> {
  // If we have an OpenWeather API Key, use it as primary
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== '') {
    return getOpenWeather(query);
  }
  
  // Fallback to WeatherAPI
  return getWeatherAPI(query);
}

async function getOpenWeather(query: string): Promise<OpenMeteoFormat> {
  try {
    const isCoords = query.includes(',');
    let url = `/openweather-api/weather?appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    if (isCoords) {
      const [lat, lon] = query.split(',');
      url += `&lat=${lat.trim()}&lon=${lon.trim()}`;
    } else {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenWeather Error: ${res.status}`);
    const data = await res.json();

    // Get forecast for daily data (OpenWeather 5 day / 3 hour)
    let forecastUrl = `/openweather-api/forecast?appid=${OPENWEATHER_API_KEY}&units=metric`;
    if (isCoords) {
      const [lat, lon] = query.split(',');
      forecastUrl += `&lat=${lat.trim()}&lon=${lon.trim()}`;
    } else {
      forecastUrl += `&q=${encodeURIComponent(query)}`;
    }

    const fRes = await fetch(forecastUrl);
    const fData = fRes.ok ? await fRes.json() : null;

    // Process forecast to get daily max temps
    const dailyTime: string[] = [];
    const dailyMax: number[] = [];
    
    if (fData && fData.list) {
      const days: Record<string, number[]> = {};
      fData.list.forEach((item: any) => {
        const date = item.dt_txt.split(' ')[0];
        if (!days[date]) days[date] = [];
        days[date].push(item.main.temp_max);
      });
      
      Object.keys(days).slice(0, 5).forEach(date => {
        dailyTime.push(date);
        dailyMax.push(Math.max(...days[date]));
      });
    }

    return {
      weather: {
        current: {
          temperature_2m: data.main.temp,
          relative_humidity_2m: data.main.humidity,
          wind_speed_10m: data.wind.speed * 3.6, // m/s to km/h
          precipitation: data.rain?.['1h'] || 0,
          uv_index: 0, // Not in basic 2.5 API
        },
        daily: {
          time: dailyTime,
          temperature_2m_max: dailyMax,
        },
      },
      city: data.name,
    };
  } catch (err) {
    console.error("OpenWeather failed, falling back to WeatherAPI", err);
    return getWeatherAPI(query);
  }
}

async function getWeatherAPI(query: string): Promise<OpenMeteoFormat> {
  const url = `/weather-api/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}&days=5&aqi=no&alerts=no`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`WeatherAPI error: ${response.status}`);
  const data = await response.json();
  
  return {
    weather: {
      current: {
        temperature_2m: data.current.temp_c,
        relative_humidity_2m: data.current.humidity,
        wind_speed_10m: data.current.wind_kph,
        precipitation: data.current.precip_mm,
        uv_index: data.current.uv,
      },
      daily: {
        time: data.forecast.forecastday.map((fd: any) => fd.date),
        temperature_2m_max: data.forecast.forecastday.map((fd: any) => fd.day.maxtemp_c),
      },
    },
    city: data.location.name,
  };
}
