# Architecture

```text
Browser (React + Vite)
  ├─ React Router pages
  ├─ Leaflet map / Recharts
  ├─ localStorage preferences
  └─ fetch /api/*
          │ Vite proxy in development
          ▼
Node.js + Express
  ├─ validation + rate limiting + in-memory TTL cache
  ├─ weather routes → Open-Meteo forecast/archive/geocoding/air quality
  ├─ disaster routes → USGS + NASA EONET + GDACS
  └─ AI route → fetch real context → Groq or Gemini
```

No persistent database is used. All external provider calls happen on the server, which centralizes validation, caching, timeouts and AI credentials. The browser stores only non-sensitive preferences and user-selected places.

## Data boundaries

- Forecast values are model forecasts.
- Archive values are reanalysis estimates, not direct station observations.
- Earthquake records are catalogue events and can be revised.
- EONET events are natural-event catalogue entries and may have point or polygon geometry.
- GDACS alerts are displayed with source attribution and source URL.
- Official Indian warnings should be checked on IMD/SACHET portals. The project does not scrape undocumented endpoints.
