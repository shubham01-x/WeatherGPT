# Windows 11 setup guide

## 1. Install Node.js

1. Visit https://nodejs.org/ and install the current LTS release (Node 20+; Node 22 LTS recommended).
2. Keep the option to add Node to PATH enabled.
3. Close and reopen VS Code.
4. In the terminal, run:

```powershell
node -v
npm -v
```

Both commands should print version numbers. If Windows says the commands are not recognized, restart Windows or repair the Node.js installation and PATH.

## 2. Open the project

Extract the WeatherGPT ZIP to a normal folder such as `C:/Users/YourName/Projects/WeatherGPT`. In VS Code choose File → Open Folder and select that folder. Do not open only the `client` folder.

## 3. Install dependencies

In the root terminal:

```powershell
npm install
npm run install:all
```

If PowerShell blocks `npm.ps1`, use the VS Code Command Prompt terminal, or run `npm.cmd install` and `npm.cmd run install:all`.

## 4. Configure the backend

Copy `server/.env.example` to `server/.env`. Example PowerShell command:

```powershell
Copy-Item server/.env.example server/.env
```

Open `server/.env` and optionally set:

- `GROQ_API_KEY` and `GROQ_MODEL`, or
- `GEMINI_API_KEY` and `GEMINI_MODEL`.

Only one provider is required. Keep the key private; do not commit `.env` to GitHub. Weather, forecast, archive, geocoding, air-quality and public disaster catalogue features do not require an AI key.

## 5. Start the application

At the project root:

```powershell
npm run dev
```

You should see the Express server at port 5000 and Vite at port 5173. Open http://localhost:5173. Keep the terminal running while using the app. Press Ctrl+C to stop both services.

## 6. Test the backend separately

Open these URLs in a browser:

- http://localhost:5000/api/health
- http://localhost:5000/api/weather/geocode?q=Jaipur
- http://localhost:5000/api/weather/current?latitude=26.9124&longitude=75.7873

A JSON response means the API route is reachable. If an external data provider is temporarily unavailable, inspect the Express terminal for the upstream error.

## 7. Browser location permission

On the dashboard press **Use my location** and allow location access in Chrome. Geolocation works on `localhost` and HTTPS origins. If denied, use the city search bar. The app does not send location to the AI provider unless the user submits a chat message with the selected weather context.

## 8. Build for production

```powershell
npm run build
$env:NODE_ENV="production"
npm start
```

Open http://localhost:5000. Express serves the generated `client/dist` folder. Production hosting must support Node.js and outbound HTTPS requests.

## 9. Common issues

- Port 5000 in use: change `PORT` in `server/.env` and update the Vite proxy target in `client/vite.config.js`.
- Port 5173 in use: Vite prints another available port.
- Missing dependency: rerun `npm run install:all` from the root.
- Invalid AI key: verify the key, provider and model name, then restart the backend.
- Browser CORS errors: use the Vite proxy in development; configure `CLIENT_ORIGIN` for production.
- Geolocation unavailable on a deployed HTTP site: use HTTPS.
