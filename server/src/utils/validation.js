export function coordinates(query) {
  const latitude = Number(query.latitude), longitude = Number(query.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    const e = new Error('Valid latitude and longitude are required.'); e.status = 400; throw e;
  }
  return { latitude, longitude };
}
export function dateRange(start, end, maxDays = 1826) {
  const a = new Date(`${start}T00:00:00Z`), b = new Date(`${end}T00:00:00Z`);
  if (!start || !end || Number.isNaN(+a) || Number.isNaN(+b) || a > b) { const e = new Error('Valid startDate and endDate (YYYY-MM-DD) are required.'); e.status=400; throw e; }
  if ((b-a)/86400000 > maxDays) { const e = new Error(`Date range cannot exceed ${maxDays} days.`); e.status=400; throw e; }
  return { startDate: start, endDate: end };
}
