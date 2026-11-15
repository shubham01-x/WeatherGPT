import axios from 'axios';
const timeout = Number(process.env.REQUEST_TIMEOUT_MS || 12000);
export const http = axios.create({ timeout, headers: { 'User-Agent': 'WeatherGPT/1.0 (weather information application)' } });
export function upstreamError(error, provider) {
  const e = new Error(`${provider} request failed: ${error.response?.status || error.message}`);
  e.status = 502; e.cause = error; return e;
}
