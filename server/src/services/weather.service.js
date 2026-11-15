
import { http, upstreamError } from '../utils/http.js';
import { cached } from '../utils/cache.js';

const BASE = 'https://api.open-meteo.com/v1';
const AQ = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEO = 'https://geocoding-api.open-meteo.com/v1';

const CACHE = {
  CURRENT: 600,
  FORECAST: 1800,
  HISTORY: 86400,
  AIR_QUALITY: 1800,
  GEOCODING: 86400,
  REVERSE_GEOCODING: 86400
};

const coordsKey = ({ latitude, longitude }) =>
  `${Number(latitude).toFixed(3)},${Number(longitude).toFixed(3)}`;

async function get(url, params, label) {
  try {
    const { data } = await http.get(url, { params });
    return data;
  } catch (e) {
    throw upstreamError(e, label);
  }
}

export function currentWeather(c) {
  return cached(
    `current:${coordsKey(c)}`,
    CACHE.CURRENT,
    () =>
      get(
        `${BASE}/forecast`,
        {
          ...c,
          current:
            'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,uv_index,dew_point_2m',
          daily:
            'temperature_2m_max,temperature_2m_min,sunrise,sunset',
          timezone: 'auto',
          forecast_days: 1
        },
        'Open-Meteo'
      )
  );
}

export function forecastWeather(c) {
  return cached(
    `forecast:${coordsKey(c)}`,
    CACHE.FORECAST,
    () =>
      get(
        `${BASE}/forecast`,
        {
          ...c,
          current:
            'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index',
          hourly:
            'temperature_2m,apparent_temperature,precipitation_probability,precipitation,relative_humidity_2m,weather_code,wind_speed_10m',
          daily:
            'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max,wind_speed_10m_max',
          timezone: 'auto',
          forecast_days: 7
        },
        'Open-Meteo'
      )
  );
}

export function historicalWeather(c, dates) {
  return cached(
    `history:${coordsKey(c)}:${dates.startDate}:${dates.endDate}`,
    CACHE.HISTORY,
    () =>
      get(
        'https://archive-api.open-meteo.com/v1/archive',
        {
          ...c,
          ...dates,
          hourly:
            'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,weather_code,wind_speed_10m',
          daily:
            'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
          timezone: 'auto'
        },
        'Open-Meteo Archive'
      )
  );
}

export function airQuality(c) {
  return cached(
    `aq:${coordsKey(c)}`,
    CACHE.AIR_QUALITY,
    () =>
      get(
        AQ,
        {
          ...c,
          current:
            'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
          hourly:
            'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
          timezone: 'auto',
          forecast_days: 2
        },
        'Open-Meteo Air Quality'
      )
  );
}

export async function geocode(q) {
  if (!q || q.trim().length < 2) {
    const e = new Error('Enter at least two characters to search.');
    e.status = 400;
    throw e;
  }

  const query = q.trim().toLowerCase();

  return cached(
    `geo:${query}`,
    CACHE.GEOCODING,
    () =>
      get(
        `${GEO}/search`,
        {
          name: q.trim(),
          count: 8,
          language: 'en',
          format: 'json'
        },
        'Open-Meteo Geocoding'
      )
  );
}

export async function reverseGeocode(c) {
  const key = `reverse:${coordsKey(c)}`;

  return cached(
    key,
    CACHE.REVERSE_GEOCODING,
    async () => {
      try {
        const { data } = await http.get(
          'https://nominatim.openstreetmap.org/reverse',
          {
            params: {
              lat: c.latitude,
              lon: c.longitude,
              format: 'jsonv2'
            },
            headers: {
              'User-Agent':
                'WeatherGPT/1.0 contact: support@example.invalid'
            }
          }
        );

        return {
          name: data.name || data.display_name,
          displayName: data.display_name,
          source: 'OpenStreetMap Nominatim'
        };
      } catch {
        return {
          name: `${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)}`,
          source: 'coordinates'
        };
      }
    }
  );
}
