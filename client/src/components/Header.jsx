import React, { useState } from "react";
import { Search, Sun, Moon, MapPin, ChevronDown, LocateFixed } from "lucide-react";
import { get } from "../services/api";
import { useApp } from "../context/AppContext";

export default function Header() {
  const { location, setLocation, theme, setTheme, unit, setUnit, recent, setRecent } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  async function search(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setLocationMessage("");
    try {
      const data = await get("/api/weather/geocode", { q: q.trim() });
      setResults(data.results || []);
      if (!data.results?.length) setLocationMessage("No matching locations found.");
    } catch (error) {
      setResults([]);
      setLocationMessage(error.response?.data?.error || "Location search failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function saveLocation(selected) {
    setLocation(selected);
    setRecent([selected, ...(recent || []).filter((r) =>
      !(r.latitude === selected.latitude && r.longitude === selected.longitude)
    )].slice(0, 6));
  }

  function choose(item) {
    saveLocation({
      name: item.name,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      country: item.country,
      admin1: item.admin1,
      source: "search",
    });
    setQ("");
    setResults([]);
    setLocationMessage("Location updated. Weather report is refreshing.");
  }

  function useLiveLocation() {
    setLocationMessage("");
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationMessage("Live location requires localhost or HTTPS and a browser that supports location access.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        let name = "My live location";
        let country = "";
        try {
          const place = await get("/api/weather/reverse-geocode", { latitude, longitude });
          name = place.name || name;
          country = place.address?.country || "";
        } catch {
          // Coordinates still identify the location; reverse geocoding is only a display-name convenience.
        }

        const selected = {
          name,
          latitude,
          longitude,
          country,
          source: "device-geolocation",
          accuracy: Math.round(position.coords.accuracy),
          updatedAt: new Date().toISOString(),
        };
        saveLocation(selected);
        setLocationMessage("Live location detected. Your local weather report is refreshing.");
        setLocating(false);
      },
      (error) => {
        const messages = {
          1: "Location permission was denied. Allow location access in your browser, or search for a city.",
          2: "Your device could not determine its location. Try again or search for a city.",
          3: "Location request timed out. Please try again.",
        };
        setLocationMessage(messages[error.code] || "Could not access your location. Search for a city instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header className="topbar">
      <div className="topbar-caption">
        <span className="topbar-kicker">YOUR WEATHER, IN FOCUS</span>
        <span className="topbar-location">
          <MapPin size={14} /> {location?.name || "Select location"}
        </span>
        {locationMessage && <span className="location-feedback" role="status">{locationMessage}</span>}
      </div>

      <form className="search-wrap" onSubmit={search}>
        <Search size={17} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city, region or country..."
          aria-label="Search location"
        />
        <button type="submit" disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </button>
        {results.length > 0 && (
          <div className="search-results">
            {results.map((item, i) => (
              <button
                type="button"
                key={`${item.id || item.name}-${i}`}
                onClick={() => choose(item)}
              >
                <MapPin size={15} />
                <span>{item.name}{item.admin1 ? `, ${item.admin1}` : ""}, {item.country}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="top-actions">
        <button
          className="location-pill live-location-button"
          type="button"
          onClick={useLiveLocation}
          disabled={locating}
          title="Use your device location to load local weather"
        >
          <LocateFixed size={15} />
          <span>{locating ? "Locating…" : "Use my location"}</span>
        </button>
        <div className="location-pill current-location-pill" title="Selected weather location">
          <MapPin size={15} />
          <span>{location?.name || "Select location"}</span>
        </div>
        <button
          className="icon-button"
          title="Switch temperature unit"
          aria-label="Switch temperature unit"
          onClick={() => setUnit(unit === "C" ? "F" : "C")}
        >
          °{unit}<ChevronDown size={12} />
        </button>
        <button
          className="icon-button theme-toggle"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-pressed={theme === "light"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
