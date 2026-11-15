
import React, {
  useEffect,
  useRef,
  useState
} from "react";

import { get } from "../services/api";
import { useApp } from "../context/AppContext";

import WeatherMap from "../components/WeatherMap";
import Panel from "../components/Panel";

export default function LiveMap() {
  const { location } = useApp();

  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [weather, setWeather] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mounted = useRef(false);
  const requestId = useRef(0);

  // Retrieve global event catalogue.
  useEffect(() => {
    let active = true;

    mounted.current = true;

    async function fetchEvents() {
      try {
        const result = await get("/api/disasters/global");

        if (active) {
          setEvents(
            Array.isArray(result) ? result : []
          );
        }

      } catch (err) {
        if (active) {
          setEvents([]);
        }
      }
    }

    fetchEvents();

    return () => {
      active = false;
      mounted.current = false;
      requestId.current++;
    };
  }, []);

  // Retrieve weather when a user selects a map location.
  async function pick(coordinates) {
    if (
      !Number.isFinite(coordinates?.latitude) ||
      !Number.isFinite(coordinates?.longitude)
    ) {
      return;
    }

    const currentRequest = ++requestId.current;

    setSelected(coordinates);
    setWeather(null);
    setBusy(true);
    setError("");

    try {
      const result = await get(
        "/api/weather/current",
        {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        }
      );

      if (
        !mounted.current ||
        currentRequest !== requestId.current
      ) {
        return;
      }

      setWeather(result);

    } catch (err) {
      if (
        !mounted.current ||
        currentRequest !== requestId.current
      ) {
        return;
      }

      setWeather(null);

      setError(
        err.response?.data?.error ||
        "Could not retrieve weather for this location."
      );

    } finally {
      if (
        mounted.current &&
        currentRequest === requestId.current
      ) {
        setBusy(false);
      }
    }
  }

  const current = weather?.current;

  return (
    <div className="page">

      {/* Page heading */}

      <div className="page-title">

        <div>

          <div className="eyebrow">
            GEOSPATIAL INTELLIGENCE
          </div>

          <h1>
            Live weather map
          </h1>

          <p>
            Explore a location and inspect available
            natural-event catalogue markers.
          </p>

        </div>

      </div>

      <div className="map-layout">

        {/* Main map */}

        <div className="map-main">

          <WeatherMap
            location={location}
            events={events}
            selected={selected}
            onPick={pick}
          />

          <div className="map-legend">

            <span>
              <i className="legend-dot blue" />
              Selected location
            </span>

            <span>
              <i className="legend-dot orange" />
              Catalogue event
            </span>

          </div>

        </div>

        {/* Map information */}

        <div className="map-side">

          <Panel
            title="Map inspection"
            subtitle="Click anywhere on the map"
          >

            {busy ? (

              <p className="muted">
                Retrieving weather...
              </p>

            ) : error ? (

              <p className="alert-box">
                {error}
              </p>

            ) : current ? (

              <>

                <div className="map-temp">
                  {Math.round(current.temperature_2m)}°C
                </div>

                <b>
                  Weather code: {current.weather_code}
                </b>

                <p className="muted">
                  Wind: {current.wind_speed_10m} km/h
                  {" · "}
                  Humidity: {current.relative_humidity_2m}%
                </p>

                <small>

                  Latitude:
                  {" "}
                  {selected?.latitude.toFixed(4)}

                  <br />

                  Longitude:
                  {" "}
                  {selected?.longitude.toFixed(4)}

                </small>

                <p className="muted">
                  Updated: {current.time
                    ? new Date(current.time).toLocaleString()
                    : "Time unavailable"}
                </p>

              </>

            ) : (

              <p className="muted">
                Click a point on the map to request
                current model weather for those coordinates.
              </p>

            )}

          </Panel>

          <Panel
            title="Visible event records"
            subtitle={`${events.length} mapped records from available catalogues`}
          >

            <div className="event-list">

              {events.slice(0, 8).map(event => (

                <div
                  className="event-item"
                  key={event.id}
                >

                  <b>
                    {event.title}
                  </b>

                  <small>
                    {event.category}
                    {" · "}
                    {event.source}
                  </small>

                </div>

              ))}

              {events.length === 0 && (

                <p className="muted">
                  No event catalogue records are currently available.
                </p>

              )}

            </div>

          </Panel>

          <div className="notice-card">

            The base map uses OpenStreetMap.
            Event markers are catalogue records, not live radar.

            Temperature, precipitation, wind and cloud raster
            overlays are not supplied by this free base-map
            integration.

          </div>

        </div>

      </div>

    </div>
  );
}
