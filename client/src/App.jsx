import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import Forecast from "./pages/Forecast";
import Disasters from "./pages/Disasters";
import Assistant from "./pages/Assistant";
import AirQuality from "./pages/AirQuality";

function Shell() {
  const { theme } = useApp();

  return (
    <div className={`app-shell theme-${theme}`}>
      <Sidebar />
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<LiveMap />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/disasters" element={<Disasters />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/air-quality" element={<AirQuality />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
