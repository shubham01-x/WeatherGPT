
import React, { useEffect, useState } from "react";

import { get } from "../services/api";
import { useApp } from "../context/AppContext";

import Panel from "../components/Panel";
import WeatherMap from "../components/WeatherMap";
import Loader from "../components/Loader";

export default function Disasters() {
  const { location } = useApp();

  const [events, setEvents] = useState([]);
  const [official, setOfficial] = useState([]);

  const [radius, setRadius] = useState(500);
  const [mode, setMode] = useState("nearby");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(isActive = () => true) {
    if (isActive()) {
      setLoading(true);
      setError("");
    }

    try {
      let result = [];
      let officialSources = [];

      if (mode === "global") {
        result = await get("/api/disasters/global");

      } else if (mode === "historical") {
        const today = new Date()
          .toISOString()
          .slice(0, 10);

        result = await get(
          "/api/disasters/historical",
          {
            latitude: location.latitude,
            longitude: location.longitude,
            radiusKm: radius,
            startDate: `${new Date().getFullYear() - 5}-01-01`,
            endDate: today
          }
        );

      } else {
        const [nearbyEvents, alerts] = await Promise.all([
          get("/api/disasters/nearby", {
            latitude: location.latitude,
            longitude: location.longitude,
            radiusKm: radius
          }),

          get("/api/disasters/alerts")
        ]);

        result = nearbyEvents;

        officialSources =
          alerts?.officialSources || [];
      }

      if (!isActive()) return;

      setEvents(
        Array.isArray(result) ? result : []
      );

      setOfficial(
        Array.isArray(officialSources)
          ? officialSources
          : []
      );

    } catch (err) {
      if (!isActive()) return;

      setError(
        err.response?.data?.error ||
        "Could not retrieve disaster catalogues."
      );

      setEvents([]);
      setOfficial([]);

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
  }, [
    location.latitude,
    location.longitude,
    mode,
    radius
  ]);

  const locationDescription =
    mode === "nearby"
      ? `Near ${location.name}`
      : mode === "historical"
        ? "Historical records"
        : "Global event catalogue";

  return (
    <div className="page">

      {/* Page heading */}

      <div className="page-title">

        <div>

          <div className="eyebrow">
            NATURAL EVENT INTELLIGENCE
          </div>

          <h1>
            Disaster watch
          </h1>

          <p>
            Explore recorded events.
            Proximity alone does not indicate a threat.
          </p>

        </div>

        <div className="title-actions">

          <select
            value={mode}
            onChange={event => setMode(event.target.value)}
            aria-label="Select event catalogue"
          >

            <option value="nearby">
              Nearby events
            </option>

            <option value="historical">
              Past 5 years
            </option>

            <option value="global">
              Global catalogue
            </option>

          </select>

          <select
            value={radius}
            onChange={event =>
              setRadius(Number(event.target.value))
            }
            aria-label="Select search radius"
            disabled={mode === "global"}
          >

            <option value="50">50 km</option>
            <option value="100">100 km</option>
            <option value="250">250 km</option>
            <option value="500">500 km</option>
            <option value="1000">1000 km</option>

          </select>

        </div>

      </div>

      {error && (

        <div className="alert-box" role="alert">
          {error}
        </div>

      )}

      <div className="disaster-layout">

        <div>

          {/* Event map */}

          <Panel
            title="Event map"
            subtitle="USGS earthquakes, NASA EONET and available GDACS records"
          >

            <div className="disaster-map">

              <WeatherMap
                location={location}
                events={events}
              />

            </div>

          </Panel>

          {/* Event records */}

          <Panel
            title={`${events.length} event records`}
            subtitle={`${locationDescription} · Sources shown per event`}
          >

            {loading ? (

              <Loader />

            ) : events.length > 0 ? (

              events.map(event => (

                <div
                  className="disaster-row"
                  key={event.id}
                >

                  <div className="disaster-bullet">

                    {event.category === "Earthquake"
                      ? "◈"
                      : "⌁"}

                  </div>

                  <div className="disaster-info">

                    <b>
                      {event.title || "Unnamed event"}
                    </b>

                    <p>

                      {event.category || "Natural event"}

                      {event.magnitude != null
                        ? ` · Magnitude ${event.magnitude}`
                        : ""}

                      {event.distanceKm != null
                        ? ` · ${event.distanceKm} km away`
                        : ""}

                    </p>

                    <small>

                      {event.place ||
                        "Location in event catalogue"}

                      {" · "}

                      {event.time
                        ? new Date(event.time).toLocaleString()
                        : "Time not supplied"}

                      {" · "}

                      {event.source || "Source unavailable"}

                    </small>

                    {event.url && (

                      <a
                        href={event.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View source ↗
                      </a>

                    )}

                  </div>

                </div>

              ))

            ) : (

              <p className="muted">
                No matching events were returned for this
                query. Catalogue coverage varies by event
                type and region.
              </p>

            )}

          </Panel>

        </div>

        {/* Right information panel */}

        <aside className="disaster-aside">

          <Panel
            title="Official warning sources"
            subtitle="Use official portals for actionable alerts"
          >

            <div className="official-list">

              <a
                href="https://sachet.ndma.gov.in/"
                target="_blank"
                rel="noreferrer"
              >
                NDMA SACHET
                <span>↗</span>
              </a>

              <a
                href="https://mausam.imd.gov.in/"
                target="_blank"
                rel="noreferrer"
              >
                India Meteorological Department
                <span>↗</span>
              </a>

              <a
                href="https://www.gdacs.org/"
                target="_blank"
                rel="noreferrer"
              >
                GDACS
                <span>↗</span>
              </a>

            </div>

            {official.map(source => (

              <small key={source.name}>
                {source.name}
              </small>

            ))}

          </Panel>

          <div className="notice-card warning">

            <b>
              Safety notice
            </b>

            <p>
              WeatherGPT is an informational catalogue,
              not an emergency warning system.

              A nearby event may be unrelated to your area.
              Follow local authorities and official alert
              instructions.
            </p>

          </div>

          <Panel title="Data coverage">

            <p className="muted">

              USGS provides earthquake catalogue data.
              NASA EONET tracks selected natural events.
              GDACS coverage and API availability can vary.

              Historical coverage is not complete for every
              hazard category.

            </p>

          </Panel>

        </aside>

      </div>

    </div>
  );
}
