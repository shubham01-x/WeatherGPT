
import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Trash2,
  Mic,
  Volume2,
  CloudSun
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import { post } from "../services/api";
import { useApp } from "../context/AppContext";

const suggestions = [
  "Will it rain tomorrow?",
  "Explain today's weather in simple language.",
  "What should I know about the UV index?",
  "Compare the forecast with yesterday."
];

export default function Assistant() {
  const { location } = useApp();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm WeatherGPT. I can explain weather data for **${location.name}** and answer forecast questions. Ask me anything about the weather.`
    }
  ]);

  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const end = useRef(null);

  // Scroll to the latest message.
  // This effect does not return a Promise or any invalid cleanup value.
  useEffect(() => {
    if (end.current) {
      end.current.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages]);

  async function send(text = value) {
    const question = text.trim();

    if (!question || busy) return;

    const userMessage = {
      role: "user",
      content: question
    };

    const previousMessages = messages;

    const updatedMessages = [
      ...previousMessages,
      userMessage
    ];

    setMessages(updatedMessages);
    setValue("");
    setBusy(true);
    setError("");

    try {
      const response = await post("/api/ai/chat", {
        message: question,
        location: location,
        history: previousMessages.slice(-8)
      });

      const answer =
        response?.answer ||
        "Sorry, I could not generate an answer.";

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: answer
        }
      ]);

    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Could not contact the AI service.";

      setError(message);

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: `I couldn't generate an answer: ${message}`
        }
      ]);

    } finally {
      setBusy(false);
    }
  }

  function voice() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setValue(transcript);
      setError("");
    };

    recognition.onerror = () => {
      setError(
        "Voice recognition failed. Please try typing."
      );
    };

    recognition.start();
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      setError(
        "Speech playback is not supported in this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";

    window.speechSynthesis.speak(speech);
  }

  function clearChat() {
    window.speechSynthesis?.cancel();

    setMessages([
      {
        role: "assistant",
        content: `Hello! I'm WeatherGPT. I can explain weather data for **${location.name}** and answer forecast questions. Ask me anything about the weather.`
      }
    ]);

    setValue("");
    setError("");
  }

  return (
    <div className="page assistant-page">

      <div className="page-title">

        <div>
          <div className="eyebrow">
            CONTEXT-AWARE WEATHER AI
          </div>

          <h1>WeatherGPT Assistant</h1>

          <p>
            Answers grounded in live weather data
            retrieved by the backend.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={clearChat}
          type="button"
        >
          <Trash2 size={15} />
          Clear chat
        </button>

      </div>

      <div className="chat-layout">

        <div className="chat-main">

          <div className="chat-context">

            <CloudSun size={18} />

            <span>
              Context location:
              <b> {location.name}</b>
            </span>

            <span className="context-status">
              Weather context fetched on send
            </span>

          </div>

          <div className="chat-messages">

            {messages.map((message, index) => (

              <div
                className={`chat-message ${message.role}`}
                key={`${message.role}-${index}`}
              >

                <div className="avatar">
                  {message.role === "assistant"
                    ? "☁"
                    : "You"}
                </div>

                <div className="bubble">

                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>

                  {message.role === "assistant" && (

                    <button
                      className="speak-button"
                      type="button"
                      onClick={() => speak(message.content)}
                    >
                      <Volume2 size={13} />
                      Listen
                    </button>

                  )}

                </div>

              </div>

            ))}

            {busy && (

              <div className="chat-message assistant">

                <div className="avatar">
                  ☁
                </div>

                <div className="bubble typing">
                  WeatherGPT is thinking...
                </div>

              </div>

            )}

            <div ref={end} />

          </div>

          {error && (

            <div
              className="chat-error"
              role="alert"
            >
              {error}
            </div>

          )}

          <div className="suggestions">

            {suggestions.map((suggestion) => (

              <button
                key={suggestion}
                type="button"
                disabled={busy}
                onClick={() => send(suggestion)}
              >
                {suggestion}
              </button>

            ))}

          </div>

          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >

            <button
              type="button"
              className="icon-button"
              onClick={voice}
              title="Voice input"
            >
              <Mic size={18} />
            </button>

            <input
              value={value}
              onChange={(event) =>
                setValue(event.target.value)
              }
              placeholder="Ask about weather, forecasts or conditions..."
              aria-label="Ask WeatherGPT"
            />

            <button
              className="send-button"
              type="submit"
              disabled={busy || !value.trim()}
            >
              <Send size={17} />
            </button>

          </form>

        </div>

        <aside className="chat-aside">

          <h3>What I can help with</h3>

          <div className="capability">
            <b>Forecast interpretation</b>
            <p>
              Rain chances, temperature changes
              and hourly outlook.
            </p>
          </div>

          <div className="capability">
            <b>Weather education</b>
            <p>
              Humidity, pressure, UV index
              and other concepts.
            </p>
          </div>

          <div className="capability">
            <b>Data limitations</b>
            <p>
              I will explain when retrieved data
              cannot support an answer.
            </p>
          </div>

          <div className="notice-card warning">
            For emergency alerts, use official IMD
            and NDMA/SACHET channels. AI responses
            are not emergency instructions.
          </div>

        </aside>

      </div>

    </div>
  );
}
