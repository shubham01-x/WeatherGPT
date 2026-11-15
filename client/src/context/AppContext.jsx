import React, { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app remains usable if browser storage is unavailable.
  }
}

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = readStored("wg-theme", "dark");
    return saved === "light" ? "light" : "dark";
  });
  const [unit, setUnitState] = useState(() => readStored("wg-unit", "C"));
  const [location, setLocationState] = useState(() =>
    readStored("wg-location", {
      name: "Jaipur",
      latitude: 26.9124,
      longitude: 75.7873,
      country: "India",
    })
  );
  const [favourites, setFavouritesState] = useState(() => readStored("wg-favourites", []));
  const [recent, setRecentState] = useState(() => readStored("wg-recent", []));

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next) => {
        const normalized = next === "light" ? "light" : "dark";
        setThemeState(normalized);
        writeStored("wg-theme", normalized);
      },
      unit,
      setUnit: (next) => {
        setUnitState(next);
        writeStored("wg-unit", next);
      },
      location,
      setLocation: (next) => {
        setLocationState(next);
        writeStored("wg-location", next);
      },
      favourites,
      setFavourites: (next) => {
        setFavouritesState(next);
        writeStored("wg-favourites", next);
      },
      recent,
      setRecent: (next) => {
        setRecentState(next);
        writeStored("wg-recent", next);
      },
    }),
    [theme, unit, location, favourites, recent]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
