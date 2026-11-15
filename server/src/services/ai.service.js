import { http } from "../utils/http.js";
import { forecastWeather, currentWeather } from "./weather.service.js";

const SYSTEM_PROMPT = [
  "You are WeatherGPT, a careful weather information assistant.",
  "Use supplied verified weather data when answering questions about current conditions or forecasts.",
  "Never invent observations, forecasts, disaster alerts, magnitudes, or official warnings.",
  "If the supplied context does not contain the answer, clearly say what is missing.",
  "Distinguish forecast/reanalysis data from station observations.",
  "For emergency or safety questions, direct users to official local authorities.",
  "Do not declare travel safe based only on weather data.",
  "Keep answers clear, practical, and easy to understand.",
].join(" ");

function buildWeatherContext(data, location) {
  if (!data) return "No verified weather context was available.";
  return JSON.stringify({
    location: location?.name || {
      latitude: location?.latitude,
      longitude: location?.longitude,
    },
    current: data.current || null,
    daily: data.daily || null,
    hourly: data.hourly?.time?.slice(0, 24).map((time, index) => ({
      time,
      temperature: data.hourly.temperature_2m?.[index],
      feelsLike: data.hourly.apparent_temperature?.[index],
      precipitationProbability: data.hourly.precipitation_probability?.[index],
      precipitation: data.hourly.precipitation?.[index],
      humidity: data.hourly.relative_humidity_2m?.[index],
      windSpeed: data.hourly.wind_speed_10m?.[index],
    })) || [],
  });
}

async function getWeatherContext(message, location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "No verified weather context was supplied because the selected location has no valid coordinates.";
  }

  const coordinates = { latitude, longitude };
  const needsForecast = /tomorrow|week|forecast|rain|weekend|hour|next few days|next 7 days/i.test(message);
  try {
    const data = needsForecast
      ? await forecastWeather(coordinates)
      : await currentWeather(coordinates);
    return buildWeatherContext(data, location);
  } catch (error) {
    return `Weather data could not be retrieved from Open-Meteo: ${error.message}`;
  }
}

function normalizeHistory(history) {
  return history
    .filter((item) => ["user", "assistant"].includes(item.role))
    .map((item) => ({
      role: item.role,
      content: String(item.content || "").slice(0, 3000),
    }));
}

async function groqCompletion(messages, model) {
  return http.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model,
      messages,
      temperature: 0.3,
      max_tokens: 900,
    },
    {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    }
  );
}

export async function chat({ message, location, history = [] }) {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const weatherContext = await getWeatherContext(message, location);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Verified weather context (JSON/text): ${weatherContext}` },
    ...normalizeHistory(history).slice(-8),
    { role: "user", content: message },
  ];

  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      const error = new Error("Gemini is not configured. Add GEMINI_API_KEY to server/.env.");
      error.status = 503;
      throw error;
    }

    const prompt = messages.map((item) => `${item.role.toUpperCase()}: ${item.content}`).join("\n\n");
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const { data } = await http.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }
      );
      const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n");
      if (!answer) throw new Error("Gemini returned an empty response.");
      return answer;
    } catch (cause) {
      const error = new Error(
        cause.response?.data?.error?.message ||
        cause.message ||
        "Gemini request failed."
      );
      error.status = 502;
      error.cause = cause;
      throw error;
    }
  }

  if (provider !== "groq") {
    const error = new Error(`Unsupported AI_PROVIDER "${provider}". Use "groq" or "gemini".`);
    error.status = 500;
    throw error;
  }

  if (!process.env.GROQ_API_KEY) {
    const error = new Error("Groq is not configured. Add GROQ_API_KEY to server/.env.");
    error.status = 503;
    throw error;
  }

  const primaryModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const fallbackModel = process.env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-120b";

  try {
    let response;
    try {
      response = await groqCompletion(messages, primaryModel);
    } catch (cause) {
      const providerStatus = cause.response?.status;
      const modelIssue = providerStatus === 404 ||
        (providerStatus === 400 && /model|decommission|not found/i.test(
          JSON.stringify(cause.response?.data || cause.message)
        ));

      if (!modelIssue || fallbackModel === primaryModel) throw cause;
      response = await groqCompletion(messages, fallbackModel);
    }

    const answer = response.data.choices?.[0]?.message?.content;
    if (!answer) throw new Error("Groq returned an empty response.");
    return answer;
  } catch (cause) {
    const providerMessage =
      cause.response?.data?.error?.message ||
      cause.response?.data?.message ||
      cause.message ||
      "Groq request failed.";

    const error = new Error(
      cause.response?.status === 401
        ? "Groq rejected the API key. Check GROQ_API_KEY in server/.env."
        : cause.response?.status === 404
          ? `Groq could not find the configured model. Set GROQ_MODEL to an available model. Provider message: ${providerMessage}`
          : `Groq AI request failed: ${providerMessage}`
    );
    error.status = 502;
    error.cause = cause;
    throw error;
  }
}
