import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// BexxaVoiceAssistant
// - Uses Web Speech API (SpeechRecognition) when available
// - Prompts for microphone permission via getUserMedia before starting
// - Creates a fresh SpeechRecognition instance on each start to avoid
//   race conditions where .start() throws if reused
// - Provides statuses: idle | listening | error | unsupported | permission
export default function BexxaVoiceAssistant() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  // Utility: speak a short message using SpeechSynthesis (if available)
  const speak = (text) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const u = new SpeechSynthesisUtterance(text);
      synth.cancel();
      synth.speak(u);
    } catch (e) {
      // ignore speech errors
    }
  };

  // Check support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("unsupported");
    }
  }, []);

  // Create a new recognition instance and wire handlers
  const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false; // we only need final results for commands
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      setStatus("listening");
    };

    recog.onresult = (ev) => {
      const text = Array.from(ev.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      setTranscript(text);
      processCommand(text);
    };

    recog.onend = () => {
      // recognition ended (user stopped speaking or stop called)
      // if we were in listening state, go back to idle
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recog.onerror = (ev) => {
      // map common errors to friendly messages/status
      const err = ev?.error || "error";
      if (err === "not-allowed" || err === "service-not-allowed") {
        setStatus("permission");
        speak("Microphone permission denied. Please enable microphone access in your browser.");
      } else {
        setStatus("error");
      }
    };

    return recog;
  };

  // Interpret recognized text into navigation commands
  const processCommand = (rawText) => {
    if (!rawText) return;
    // normalize and strip common wake words so users can say "hi bexxa" or
    // accidentally say "alexa" — treat both as addressing Bexxa
    let text = rawText.toLowerCase().trim();

    // remove common leading interjections/wake words like "hi bexxa", "hey bexxa", "bexxa"
    text = text.replace(/^\s*(hey|hi|ok|okay)\s+(bexxa|alexa)\b\s*/i, "");
    // also remove a leading lone wake name: "bexxa, find nearby"
    text = text.replace(/^\s*(bexxa|alexa)\b[:,\-]?\s*/i, "");

    const navigateToPreferred = (paths) => {
      navigate(paths[0]);
    };

    if (text.includes("find nearby") || text.includes("nearest service") || text.includes("nearest station") || text.includes("nearby stations") || text.includes("nearby station")) {
      speak("Opening nearby stations.");
      navigateToPreferred(["/nearby"]);
      return;
    }

    if (text.includes("create report") || text.includes("new report") || (text.includes("report") && text.includes("create"))) {
      speak("Opening create report.");
      navigateToPreferred(["/create-report", "/reports/create"]);
      return;
    }

    if (text.includes("go home") || text === "home" || text.includes("take me home")) {
      speak("Going home.");
      navigateToPreferred(["/home", "/"]);
      return;
    }

    // default
    speak("Sorry, I didn't understand that. Try: find nearby stations, create report, or go home.");
  };

  // Toggle listening (start/stop). We request microphone permission via getUserMedia
  // first to surface permission errors to the user and to ensure the mic is available.
  const toggleListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("unsupported");
      speak("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // If currently listening, stop the current recognition
    if (status === "listening") {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setStatus("idle");
      return;
    }

    // Ask for microphone permission by calling getUserMedia. This prompts the user
    // and provides clearer permission errors than relying on SpeechRecognition alone.
    try {
      // request a short-lived stream just to prompt for permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // we don't need to keep the stream open; stop its tracks
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      // permission denied or no microphone
      setStatus("permission");
      speak("Microphone access is required. Please enable the microphone in your browser settings.");
      return;
    }

    // create and start recognition
    try {
      const recog = createRecognition();
      if (!recog) {
        setStatus("unsupported");
        speak("Speech recognition not available.");
        return;
      }

      // store and start
      recognitionRef.current = recog;
      setTranscript("");
      setStatus("listening");
      recog.start();
    } catch (e) {
      setStatus("error");
      speak("Could not start speech recognition.");
    }
  };

  // Simple status label for UI
  const statusLabel = () => {
    switch (status) {
      case "listening":
        return "Listening...";
      case "permission":
        return "Permission denied";
      case "unsupported":
        return "Not supported";
      case "error":
        return "Error";
      default:
        return "Idle";
    }
  };

  return (
    <div className="mt-6">
      {/* Microphone button and indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleListening}
          aria-pressed={status === "listening"}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${status === "listening" ? "bg-red-500/80 text-white border-red-400" : "bg-white/5 text-white border-white/10"}`}
        >
          <svg className={`w-5 h-5 ${status === "listening" ? "animate-pulse" : ""}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
            <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z" />
          </svg>
          <span className="font-semibold">{status === "listening" ? "Listening..." : "Talk to Bexxa"}</span>
        </button>

        {/* visual listening indicator */}
        <div className="flex items-center gap-2">
          <div
            aria-hidden
            className={`w-3 h-3 rounded-full ${status === "listening" ? "bg-red-400 shadow-lg animate-pulse" : "bg-white/20"}`}
          />
          <div className="text-sm text-gray-300">{statusLabel()}</div>
        </div>
      </div>

      {/* Transcript display */}
      <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-md text-sm text-gray-200">
        <div className="text-xs text-white/60 mb-1">Transcript</div>
        <div>{transcript || <span className="text-white/40">No speech captured yet.</span>}</div>
      </div>
    </div>
  );
}
