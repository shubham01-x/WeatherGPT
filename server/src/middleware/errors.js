export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || (error.response ? 502 : 500);
  const message = status >= 500 && status !== 502
    ? "Unexpected server error"
    : error.message;

  if (process.env.NODE_ENV !== "test") {
    console.error("[WeatherGPT API]", error.message);
    if (error.cause?.response?.data) {
      console.error("[WeatherGPT upstream details]", error.cause.response.data);
    }
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && error.cause?.response?.data
      ? { details: error.cause.response.data }
      : {}),
  });
}
