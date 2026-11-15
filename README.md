# WeatherGPT

WeatherGPT is a React + Express weather intelligence application. It uses Open-Meteo for forecast, archive and air-quality data; USGS for earthquake records; NASA EONET and GDACS for natural-event discovery; and an optional server-side Groq or Gemini model for grounded chat responses.

## Important data notes

- Open-Meteo weather values are model/reanalysis products, not necessarily measurements from a nearby weather station. Historical archive data has dataset-specific resolution and publication delay.
- USGS is an authoritative earthquake catalogue, but it is not a complete global catalogue of every hazard.
- NASA EONET is an event discovery catalogue. It is not an emergency warning service.
- GDACS availability and event coverage can vary. Its results are shown with source attribution.
- SACHET/NDMA and IMD official alert portals are linked in the app. There is no assumed undocumented public API. For automated official alerts, obtain authorized API/feed access and configure the optional adapter described in `documentation/data-sources.md`.
- A nearby event is not automatically a threat. WeatherGPT is informational and must not replace official emergency instructions.

## Requirements

- Node.js 20 LTS or newer (Node 22 LTS recommended)
- npm 10+
- Internet connection
- A modern browser
- Optional: Groq or Google Gemini API key for generative AI chat

## Quick start (Windows 11 / VS Code)

1. Install Node.js LTS from https://nodejs.org/ and restart VS Code.
2. Open this `WeatherGPT` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run `npm install` at the project root.
5. Run `npm run install:all`.
6. Copy `server/.env.example` to `server/.env`.
7. Add at least one AI key if you want generative chat. Weather and disaster endpoints work without an AI key.
8. Run `npm run dev` at the root.
9. Open the Vite URL printed in the terminal (normally http://localhost:5173).

The frontend proxies `/api` requests to Express at `http://localhost:5000` during development.

## Environment variables

See `server/.env.example`. Never put provider keys in `client/.env` or React source code. `GROQ_API_KEY` is recommended for the OpenAI-compatible Groq endpoint. Alternatively configure `GEMINI_API_KEY`.

## Useful endpoints

- `GET /api/health`
- `GET /api/weather/current?latitude=26.9124&longitude=75.7873`
- `GET /api/weather/forecast?latitude=26.9124&longitude=75.7873`
- `GET /api/weather/historical?latitude=26.9124&longitude=75.7873&startDate=2025-01-01&endDate=2025-01-07`
- `GET /api/weather/air-quality?latitude=26.9124&longitude=75.7873`
- `GET /api/weather/geocode?q=Jaipur`
- `GET /api/disasters/earthquakes?latitude=26.9124&longitude=75.7873&radiusKm=500`
- `GET /api/disasters/global`
- `GET /api/disasters/nearby?latitude=26.9124&longitude=75.7873&radiusKm=500`
- `GET /api/disasters/historical?latitude=26.9124&longitude=75.7873&radiusKm=500&startDate=2021-01-01&endDate=2026-11-09`
- `POST /api/ai/chat`

## Production build

```bash
npm run build
npm start
```

Express serves `client/dist` when it exists. Set `NODE_ENV=production` and configure the host's environment variables. Deploy the whole repository to a Node-compatible host. For Vercel/Netlify static frontend hosting, configure a separate Express service and set `VITE_API_BASE_URL` to its HTTPS URL before building.

## No database

This project intentionally uses no database. Favourites, recent searches, theme and units are saved in browser localStorage. API responses are cached briefly in server memory; restarting the server clears that cache.

## Troubleshooting

- `Failed to fetch`: confirm both dev servers are running; check the Express terminal.
- Geolocation denied: search a city manually. Browser geolocation requires localhost or HTTPS.
- Map tiles blank: check internet access and the browser console. OpenStreetMap tiles require attribution.
- Chat says no AI provider configured: add a Groq or Gemini key to `server/.env`, then restart Express.
- API rate limits: wait and retry. The backend has a small in-memory cache and request timeout, but public free services are not unlimited.

See `documentation/setup-guide.md`, `documentation/architecture.md`, `documentation/api-documentation.md` and `documentation/data-sources.md` for details.


## Updated build notes

- Light and dark themes are applied to the single application root and the selected theme is saved in browser local storage.
- The History navigation item and route have been removed.
- The AI endpoint is `POST /api/ai/chat`; check `GET /api/ai/health` to confirm that the API route is mounted and the selected provider key is configured.
- Groq defaults to `openai/gpt-oss-120b` and can fall back to `llama-3.3-70b-versatile` for model-not-found responses. You can override these with `GROQ_MODEL` and `GROQ_FALLBACK_MODEL`.

### Run locally

1. Install Node.js LTS.
2. From the project root run `npm run install:all`.
3. Copy `server/.env.example` to `server/.env` and add a valid Groq or Gemini API key.
4. From the project root run `npm run dev`.
5. Open `http://localhost:5173`.

Never commit `server/.env`. If an API key has appeared in a screenshot or shared message, revoke it and create a new key.


## Device live location and local weather

- Select **Use my location** in the top toolbar and allow the browser location permission.
- The browser supplies latitude/longitude using the Geolocation API. WeatherGPT uses those coordinates to reverse-geocode a readable place name and then refreshes the dashboard weather, forecast, air-quality and nearby-event data.
- Browser location access works on `http://localhost` during development and on HTTPS in deployment. It will not work on an ordinary insecure remote HTTP site.
- If permission is denied or unavailable, users can continue using the city search.
- The app does not request location until the user presses the button. Coordinates are kept in the app's local browser state/storage as the selected location.
- Weather reports are estimates from the configured weather data source; they are not guaranteed station observations or emergency alerts.

### If location access is blocked

In Chrome, open the site, click the icon left of the address bar, open **Site settings**, set **Location** to **Allow**, return to WeatherGPT, and click **Use my location** again.
