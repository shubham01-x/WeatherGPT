import React from "react";
import { NavLink } from "react-router-dom";
import {
  CloudSun,
  LayoutDashboard,
  Map,
  CalendarDays,
  Activity,
  MessageCircle,
  Wind,
} from "lucide-react";

const links = [
  ["/", "Overview", LayoutDashboard],
  ["/map", "Live map", Map],
  ["/forecast", "Forecast", CalendarDays],
  ["/disasters", "Disaster watch", Activity],
  ["/assistant", "AI assistant", MessageCircle],
  ["/air-quality", "Air quality", Wind],
];

export default function Sidebar() {
  return (
    <div className="site-nav">
      <NavLink to="/" className="nav-brand">
        <span className="brand-mark"><CloudSun size={25} /></span>
        <span className="brand-copy">
          <strong>WeatherGPT</strong>
          <small>WEATHER INTELLIGENCE</small>
        </span>
      </NavLink>

      <nav className="nav-links" aria-label="Main navigation">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={17} strokeWidth={1.9} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <a
        href="https://sachet.ndma.gov.in/"
        target="_blank"
        rel="noreferrer"
        className="nav-official"
      >
        Official India alerts ↗
      </a>
    </div>
  );
}
