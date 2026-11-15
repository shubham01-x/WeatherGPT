import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";
import { useApp } from "../context/AppContext";
import { weatherEmoji, weatherLabel } from "../utils/weather";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { CloudSun, Droplets, ThermometerSun, Wind, Umbrella } from "lucide-react";
import Panel from "../components/Panel";
import Loader from "../components/Loader";

export default function Forecast() {
  const { location, unit } = useApp();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("24");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setErr("");
      try {
        const result = await get("/api/weather/forecast", { latitude: location.latitude, longitude: location.longitude });
        if (!cancelled) setData(result);
      } catch (error) {
        if (!cancelled) setErr(error.response?.data?.error || error.message || "Unable to load forecast.");
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [location.latitude, location.longitude]);

  const h = data?.hourly, d = data?.daily, current = data?.current;
  const convert = (value) => value == null ? "—" : Math.round(unit === "F" ? value * 9 / 5 + 32 : value);
  const hourly = useMemo(() => (h?.time || []).slice(0, Number(range)).map((time, i) => ({
    time: new Date(time).toLocaleTimeString([], { hour: "numeric" }),
    temperature: h.temperature_2m?.[i], rain: h.precipitation_probability?.[i] ?? 0,
  })), [h, range]);

  if (loading && !data) return <Loader />;

  return (
    <div className="page forecast-page">
      <section className="forecast-banner">
        <div className="forecast-banner-copy">
          <div className="eyebrow forecast-eyebrow">WEATHER OUTLOOK · {location.name?.toUpperCase()}</div>
          <h1>Plan ahead with <span>confidence.</span></h1>
          <p>Explore the next hours and the coming week with clear, easy-to-read weather insights.</p>
          <div className="forecast-banner-meta">
            <span><CloudSun size={15}/> {weatherLabel(current?.weather_code) || "Local conditions"}</span>
            <span><ThermometerSun size={15}/> Feels like {convert(current?.apparent_temperature)}°{unit}</span>
          </div>
        </div>
        <div className="forecast-banner-icon"><div className="forecast-glow"/><span>{weatherEmoji(current?.weather_code)}</span><small>{convert(current?.temperature_2m)}°{unit}</small></div>
      </section>
      {err && <div className="alert-box">{err}</div>}
      <div className="forecast-section-heading">
        <div><div className="eyebrow">THE WEEK AHEAD</div><h2>7-day forecast</h2><p>Daily conditions, temperature range and chance of rain.</p></div>
        <span className="forecast-location-chip"><span className="live-dot"/> {location.name}</span>
      </div>
      <section className="week-grid">
        {(d?.time || []).map((date, i) => {
          const code = d.weather_code?.[i], rain = d.precipitation_probability_max?.[i] ?? 0;
          return <article className={`day-card ${i === 0 ? "today" : ""}`} key={date}>
            <div className="day-card-top"><span>{i === 0 ? "Today" : new Date(date).toLocaleDateString([], { weekday: "short" })}</span>{i === 0 && <b>NOW</b>}</div>
            <div className="day-weather-icon">{weatherEmoji(code)}</div>
            <div className="day-condition">{weatherLabel(code)}</div>
            <div className="day-temperatures"><strong>{convert(d.temperature_2m_max?.[i])}°</strong><span>{convert(d.temperature_2m_min?.[i])}°</span></div>
            <div className="day-rain"><Droplets size={13}/>{rain}%</div>
            <div className="day-range-track"><i style={{ left: `${Math.max(0, Math.min(75, (Number(d.temperature_2m_min?.[i] || 0) + 10) * 1.2))}%`, width: `${Math.max(12, Math.min(70, ((d.temperature_2m_max?.[i] || 0) - (d.temperature_2m_min?.[i] || 0)) * 2.4))}%` }}/></div>
          </article>;
        })}
      </section>
      <section className="forecast-highlights">
        <div className="forecast-highlight"><span className="highlight-icon"><ThermometerSun size={18}/></span><div><small>Current temperature</small><b>{convert(current?.temperature_2m)}°{unit}</b></div></div>
        <div className="forecast-highlight"><span className="highlight-icon aqua"><Umbrella size={18}/></span><div><small>Today's rain chance</small><b>{d?.precipitation_probability_max?.[0] ?? "—"}%</b></div></div>
        <div className="forecast-highlight"><span className="highlight-icon gold"><Wind size={18}/></span><div><small>Wind speed</small><b>{current?.wind_speed_10m ?? "—"} <small>km/h</small></b></div></div>
        <div className="forecast-highlight"><span className="highlight-icon violet"><CloudSun size={18}/></span><div><small>Weather condition</small><b>{weatherLabel(current?.weather_code) || "—"}</b></div></div>
      </section>
      <div className="forecast-section-heading chart-heading">
        <div><div className="eyebrow">HOUR BY HOUR</div><h2>Track the changes</h2><p>Temperature and precipitation probability through the day.</p></div>
        <div className="range-switch"><button className={range === "24" ? "selected" : ""} onClick={() => setRange("24")}>24 hours</button><button className={range === "48" ? "selected" : ""} onClick={() => setRange("48")}>48 hours</button></div>
      </div>
      <div className="content-grid forecast-charts">
        <Panel title="Temperature trend" subtitle={`Hourly temperature · °${unit}`}>
          <ResponsiveContainer width="100%" height={270}><AreaChart data={hourly}>
            <defs><linearGradient id="forecastTempFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55b8f5" stopOpacity={0.35}/><stop offset="100%" stopColor="#55b8f5" stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/><XAxis dataKey="time" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false} width={35}/>
            <Tooltip contentStyle={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12}}/><Area type="monotone" dataKey="temperature" stroke="#55b8f5" strokeWidth={3} fill="url(#forecastTempFill)" name={`Temperature °${unit}`}/>
          </AreaChart></ResponsiveContainer>
        </Panel>
        <Panel title="Chance of rain" subtitle="Hourly precipitation probability">
          <ResponsiveContainer width="100%" height={270}><BarChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/><XAxis dataKey="time" tickLine={false} axisLine={false}/><YAxis unit="%" tickLine={false} axisLine={false} width={35}/>
            <Tooltip contentStyle={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12}}/><Bar dataKey="rain" fill="#61c6bb" radius={[6,6,0,0]} name="Rain chance"/>
          </BarChart></ResponsiveContainer>
        </Panel>
      </div>
      <p className="data-footnote">Forecasts are numerical weather model outputs and can change as models update. For severe-weather decisions, consult official meteorological warnings.</p>
    </div>
  );
}
