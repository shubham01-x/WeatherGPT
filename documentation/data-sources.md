# Data sources, coverage and limitations

| Feature | Source | Notes |
|---|---|---|
| Current conditions and forecast | Open-Meteo Forecast API | Model-based current conditions and forecast; not guaranteed station observations. |
| Historical weather | Open-Meteo Archive API | ERA5/ERA5-Land reanalysis. Dataset resolution and publication delay apply. |
| City search | Open-Meteo Geocoding API | Results may be ambiguous; select the correct region/country. |
| Air quality | Open-Meteo Air Quality API | Modelled/reanalysis air-quality fields; do not present as a regulatory monitoring station reading. |
| Earthquakes | USGS FDSN event service | Query supports dates, magnitude and radius. Catalogue coverage is not uniform for all magnitudes/regions. |
| Natural events | NASA EONET v3 | Event catalogue; not an emergency alert service and not a complete disaster archive. |
| Global alerts | GDACS API | Free API described in GDACS quick-start; availability/schema may change. |
| Indian official alerts | NDMA SACHET / IMD | Official portals are linked. Automated integration requires an authorized public feed/API and its terms. No undocumented private endpoint is assumed. |

## API references

- Open-Meteo forecast: https://open-meteo.com/en/docs
- Open-Meteo historical: https://open-meteo.com/en/docs/historical-weather-api
- Open-Meteo air quality: https://open-meteo.com/en/docs/air-quality-api
- Open-Meteo geocoding: https://open-meteo.com/en/docs/geocoding-api
- USGS FDSN: https://earthquake.usgs.gov/fdsnws/event/1/
- NASA EONET v3: https://eonet.gsfc.nasa.gov/docs/v3
- GDACS API quick start: https://www.gdacs.org/Documents/2025/GDACS_API_quickstart_v1.pdf
- NDMA SACHET: https://sachet.ndma.gov.in/
- IMD API portal: https://api.imd.gov.in/public/

Review the providers' current terms, attribution requirements, rate limits and commercial-use conditions before public/commercial deployment. Open-Meteo's free hosted API is intended for non-commercial use; commercial deployments should select a suitable paid plan or self-host where permitted.
