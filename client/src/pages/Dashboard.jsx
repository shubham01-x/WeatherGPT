
import React, { useEffect, useState } from "react";

import {
  Cloud,
  Wind,
  Droplets,
  Gauge,
  Sun,
  Eye,
  LocateFixed,
  RefreshCw,
  ArrowUpRight,
  Activity
} from "lucide-react";

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

import { get } from "../services/api";
import { useApp } from "../context/AppContext";

import {
  weatherEmoji,
  weatherLabel,
  formatTime
} from "../utils/weather";

import StatCard from "../components/StatCard";
import Panel from "../components/Panel";
import Loader from "../components/Loader";

export default function Dashboard() {
  const { location, setLocation, unit } = useApp();

  const [data, setData] = useState(null);
  const [aq, setAq] = useState(null);
  const [events, setEvents] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(isActive = () => true) {
    if (isActive()) {
      setLoading(true);
      setError("");
    }

    const coordinates = {
      latitude: location.latitude,
      longitude: location.longitude
    };

    try {
      const [weather, airQuality, disasterEvents] =
        await Promise.all([
          get("/api/weather/forecast", coordinates),

          get("/api/weather/air-quality", coordinates)
            .catch(() => null),

          get("/api/disasters/nearby", {
            ...coordinates,
            radiusKm: 250
          }).catch(() => [])
        ]);

      if (!isActive()) return;

      setData(weather);
      setAq(airQuality);

      setEvents(
        Array.isArray(disasterEvents)
          ? disasterEvents.slice(0, 4)
          : []
      );

    } catch (err) {
      if (!isActive()) return;

      setError(
        err.response?.data?.error ||
        "Could not load weather. Check the backend connection."
      );

    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let active = true;

    load(() => active);

    return () => {
      active = false;
    };
  }, [location.latitude, location.longitude]);

  function locate() {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setError("");

    navigator.geolocation.getCurrentPosition(
      async position => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        let name = "My location";
        let country = "";

        try {
          const result = await get(
            "/api/weather/reverse-geocode",
            coordinates
          );

          name = result.name || name;
          country = result.country || "";

        } catch {
          // Coordinates still work without reverse geocoding.
        }

        setLocation({
          ...coordinates,
          name,
          country
        });
      },

      () => {
        setError(
          "Location permission was denied. Search for a city instead."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  const current = data?.current;
  const daily = data?.daily;
  const hourly = data?.hourly;

  function temp(value) {
    if (value == null || !Number.isFinite(Number(value))) {
      return "—";
    }

    return Math.round(
      unit === "F"
        ? Number(value) * 9 / 5 + 32
        : Number(value)
    );
  }

  const hourlyChartData = (hourly?.time || [])
    .slice(0, 24)
    .map((time, index) => ({
      time: new Date(time).toLocaleTimeString([], {
        hour: "numeric"
      }),

      temp: hourly.temperature_2m?.[index],

      rain: hourly.precipitation_probability?.[index]
    }));

  if (loading && !data) {
    return <Loader />;
  }

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "morning"
      : hour < 18
        ? "afternoon"
        : "evening";

  return (
    <div className="page dashboard-page">

      {/* WeatherGPT branding */}

      <section className="dashboard-masthead">

        <div className="masthead-copy">

          <div className="masthead-overline">
            INTELLIGENT WEATHER. CLEARER DECISIONS.
          </div>

          <h1 className="masthead-brand">
            Weather<span>GPT</span>
          </h1>

          <p>
            Your world, at a glance. Explore live
            conditions, forecasts and environmental insights.
          </p>

          <div className="masthead-pills">
            <span>
              <i className="live-dot" />
              Live weather data
            </span>

            <span>✦ AI-powered insights</span>

            <span>◎ Global locations</span>
          </div>

        </div>

        <div className="masthead-art">

          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="masthead-sun">
            ☀
          </div>

          <div className="masthead-cloud">
            ☁
          </div>

          <span className="art-temp">
            {current?.temperature_2m != null
              ? `${temp(current.temperature_2m)}°${unit}`
              : "LIVE"}
          </span>

        </div>

      </section>

      {/* Dashboard heading */}

      <div className="page-title">

        <div>
          <div className="eyebrow">
            WEATHER OVERVIEW
          </div>

          <h1>
            Good {greeting}
          </h1>

          <p>
            Your live atmospheric snapshot and local outlook.
          </p>
        </div>

        <div className="title-actions">

          <button
            className="secondary-button"
            type="button"
            onClick={locate}
          >
            <LocateFixed size={16} />
            Use my location
          </button>

          <button
            className="icon-button"
            type="button"
            onClick={() => load()}
            disabled={loading}
            title="Refresh weather"
          >
            <RefreshCw size={16} />
          </button>

        </div>

      </div>

      {error && (
        <div className="alert-box" role="alert">
          {error}
        </div>
      )}

      {/* Current weather */}

      <section className="hero-weather">

        <div className="hero-main">

          <div className="hero-location">
            <MapPinIcon />
            {location.name}
            {location.country
              ? `, ${location.country}`
              : ""}
          </div>

          <div className="hero-temp">
            {temp(current?.temperature_2m)}°
            <span>{unit}</span>
          </div>

          <div className="hero-condition">
            {weatherEmoji(current?.weather_code)}
            {" "}
            {weatherLabel(current?.weather_code)}
          </div>

          <div className="hero-feels">
            Feels like {temp(current?.apparent_temperature)}°
            {" · "}
            Updated {formatTime(current?.time)}
          </div>

        </div>

        <div className="hero-side">

          <div className="sun-orb">
            {weatherEmoji(current?.weather_code)}
          </div>

          <div className="hero-highlow">

            <span>
              H {temp(daily?.temperature_2m_max?.[0])}°
            </span>

            <span>
              L {temp(daily?.temperature_2m_min?.[0])}°
            </span>

          </div>

          <small>
            Model-based current conditions
          </small>

        </div>

      </section>

      {/* Atmospheric conditions */}

      <div className="section-row">

        <h2>
          Atmospheric conditions
        </h2>

        <span className="muted">
          {new Date().toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric"
          })}
        </span>

      </div>

      <div className="stats-grid">

        <StatCard
          icon={Droplets}
          label="Humidity"
          value={current?.relative_humidity_2m}
          unit="%"
        />

        <StatCard
          icon={Wind}
          label="Wind"
          value={current?.wind_speed_10m}
          unit="km/h"
          detail={`${current?.wind_direction_10m ?? "—"}° direction`}
        />

        <StatCard
          icon={Gauge}
          label="Pressure"
          value={current?.pressure_msl}
          unit="hPa"
        />

        <StatCard
          icon={Cloud}
          label="Cloud cover"
          value={current?.cloud_cover}
          unit="%"
        />

        <StatCard
          icon={Droplets}
          label="Precipitation"
          value={current?.precipitation}
          unit="mm"
        />

        <StatCard
          icon={Sun}
          label="UV index"
          value={current?.uv_index?.toFixed?.(1) ?? current?.uv_index}
          detail="Check protection guidance"
        />

        <StatCard
          icon={Eye}
          label="Visibility"
          value={
            current?.visibility != null
              ? (current.visibility / 1000).toFixed(1)
              : "—"
          }
          unit="km"
        />

        <StatCard
          icon={Activity}
          label="Dew point"
          value={current?.dew_point_2m}
          unit="°C"
        />

      </div>

      {/* Weather charts */}

      <div className="content-grid">

        <Panel
          title="Next 24 hours"
          subtitle="Temperature and precipitation probability"
        >

          <div className="chart-wrap">

            <ResponsiveContainer width="100%" height={220}>

              <AreaChart data={hourlyChartData}>

                <defs>
                  <linearGradient
                    id="tempFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#65b9ff"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="100%"
                      stopColor="#65b9ff"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis hide />

                <Tooltip
                  contentStyle={{
                    background: "#10243b",
                    border: "1px solid #29435f",
                    borderRadius: 12
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#65b9ff"
                  fill="url(#tempFill)"
                  strokeWidth={2.5}
                  name={`Temperature °${unit}`}
                />

                <Line
                  type="monotone"
                  dataKey="rain"
                  stroke="#8bd8c4"
                  name="Rain chance %"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </Panel>

        <Panel
          title="7-day outlook"
          subtitle="Daily high and low"
        >

          <div className="forecast-list">

            {(daily?.time || []).map((date, index) => (

              <div
                className="forecast-row"
                key={date}
              >

                <span className="forecast-day">
                  {index === 0
                    ? "Today"
                    : new Date(date).toLocaleDateString(
                        [],
                        { weekday: "short" }
                      )}
                </span>

                <span className="forecast-icon">
                  {weatherEmoji(daily.weather_code?.[index])}
                </span>

                <span className="forecast-desc">
                  {weatherLabel(daily.weather_code?.[index])}
                </span>

                <span className="forecast-range">

                  <b>
                    {temp(daily.temperature_2m_max?.[index])}°
                  </b>

                  <i>
                    {temp(daily.temperature_2m_min?.[index])}°
                  </i>

                </span>

              </div>

            ))}

          </div>

        </Panel>

      </div>

      {/* AQI and disaster information */}

      <div className="content-grid lower-grid">

        <Panel
          title="Air quality snapshot"
          subtitle="Open-Meteo model data"
          action={
            <a className="text-link" href="/air-quality">
              Details <ArrowUpRight size={14} />
            </a>
          }
        >

          {aq?.indianAqi ? (

            <div className="aqi-summary">

              <div className="aqi-number">

                {aq.indianAqi.value ?? "—"}

                <small>
                  INDIA AQI
                </small>

              </div>

              <div>

                <b>
                  {aq.indianAqi.category?.label ||
                    "Insufficient data"}
                </b>

                <p className="muted">
                  PM2.5: {aq.current?.pm2_5 ?? "—"} μg/m³
                  {" · "}
                  PM10: {aq.current?.pm10 ?? "—"} μg/m³
                </p>

                <small className="muted">
                  Open-Meteo model estimate ·
                  not official CPCB station data
                </small>

              </div>

            </div>

          ) : (

            <p className="muted">
              Indian AQI data unavailable or insufficient.
            </p>

          )}

        </Panel>

        <Panel
          title="Nearby natural events"
          subtitle="Catalogue events within 250 km"
          action={
            <a className="text-link" href="/disasters">
              Explore <ArrowUpRight size={14} />
            </a>
          }
        >

          {events.length > 0 ? (

            events.map(event => (

              <div
                className="event-mini"
                key={event.id}
              >

                <span className="event-symbol">
                  ⌁
                </span>

                <div>

                  <b>{event.title}</b>

                  <small>
                    {event.category}
                    {" · "}
                    {event.distanceKm ?? "—"} km
                    {" · "}
                    {event.source}
                  </small>

                </div>

              </div>

            ))

          ) : (

            <p className="muted">
              No matching catalogue events returned.
              This does not mean there is no local hazard.
            </p>

          )}

        </Panel>

      </div>

      <p className="data-footnote">
        Weather values are model-based estimates from
        Open-Meteo, not guaranteed local station observations.
        Always follow official warnings.
      </p>

    </div>
  );
}

function MapPinIcon() {
  return <span>⌖</span>;
}
