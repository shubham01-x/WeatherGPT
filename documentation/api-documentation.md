# Backend API reference

All coordinates are WGS84 decimal degrees. Latitude must be -90..90 and longitude -180..180.

## Weather

- `GET /api/weather/current?latitude=&longitude=` — current fields and location coordinates.
- `GET /api/weather/forecast?latitude=&longitude=` — current, hourly (48h) and daily (7d) forecast.
- `GET /api/weather/historical?latitude=&longitude=&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — archive weather; maximum request range is 5 years per call.
- `GET /api/weather/air-quality?latitude=&longitude=` — current and hourly pollutants/AQI fields.
- `GET /api/weather/geocode?q=` — city search.
- `GET /api/weather/reverse-geocode?latitude=&longitude=` — Uses OpenStreetMap Nominatim reverse lookup as a best-effort display-name lookup; if unavailable, returns the coordinates.

## Disasters

- `GET /api/disasters/earthquakes?latitude=&longitude=&radiusKm=500&startDate=&endDate=&minMagnitude=` — USGS catalogue query.
- `GET /api/disasters/global` — merged best-effort GDACS and EONET event catalogue results.
- `GET /api/disasters/nearby?latitude=&longitude=&radiusKm=100` — filters global catalogue events with usable coordinates.
- `GET /api/disasters/historical?latitude=&longitude=&radiusKm=500&startDate=&endDate=` — historical USGS earthquakes and EONET events in requested range.
- `GET /api/disasters/alerts` — current GDACS events and official India alert portal links; it does not claim to mirror all SACHET alerts.

## AI

- `POST /api/ai/chat` body: `{ "message": "Will it rain tomorrow?", "location": {"name":"Jaipur", "latitude":26.9124,"longitude":75.7873}, "history": [] }`.

The backend retrieves forecast or current weather context for the supplied location before calling the configured model. If no AI provider is configured, it returns HTTP 503 with setup guidance. Do not send sensitive personal information.

## Health

- `GET /api/health` — service status and timestamp.
