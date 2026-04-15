const WEATHER_API_KEY = '4eb7811e4ca04217b6892318261004';

interface WeatherAPIResponse {
  location: {
    name: string;
    lat: number;
    lon: number;
    region: string;
  };
  current: {
    temp_c: number;
    humidity: number;
    wind_kph: number;
    condition: {
      text: string;
    };
    precip_mm: number;
    uv: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
        };
      };
    }>;
  };
}

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
  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}&days=5&aqi=no&alerts=no`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data: WeatherAPIResponse = await response.json();
    
    // Map to OpenMeteo format
    const mapped: OpenMeteoFormat = {
      weather: {
        current: {
          temperature_2m: data.current.temp_c,
          relative_humidity_2m: data.current.humidity,
          wind_speed_10m: data.current.wind_kph,
          precipitation: data.current.precip_mm,
          uv_index: data.current.uv,
        },
        daily: {
          time: data.forecast.forecastday.map(fd => fd.date),
          temperature_2m_max: data.forecast.forecastday.map(fd => fd.day.maxtemp_c),
        },
      },
    };

    mapped.city = data.location?.name || query;

    return mapped;
  } catch (error) {
    console.error('Weather API fetch failed:', error);
    throw error;
  }
}

// Usage: getWeather('Mumbai') or getWeather('19.0760,72.8777')

