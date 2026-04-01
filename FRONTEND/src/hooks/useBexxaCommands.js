/**
 * useBexxaCommands — command recognition + parsing hook.
 *
 * Key fixes vs previous version:
 *  - processCommand stored in a ref so startCommandListening never captures a stale version
 *  - navigate / onReportData stored in refs — no stale closure issues
 *  - startCommandListening has no deps (uses refs only) — stable identity across renders
 */

import { useRef, useState, useCallback, useEffect } from "react";

// ── Parsing helpers (exported so tests can use them) ──────────────────────────

const WORD_TO_NUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
};

export function extractRating(text) {
  const t = text.toLowerCase();
  const outOf = t.match(/(\w+)\s*(?:out of|\/)\s*5/i);
  if (outOf && WORD_TO_NUM[outOf[1]]) return WORD_TO_NUM[outOf[1]];
  const stars = t.match(/(\w+)\s+stars?/i);
  if (stars && WORD_TO_NUM[stars[1]]) return WORD_TO_NUM[stars[1]];
  return null;
}

export function extractBusyLevel(text) {
  const t = text.toLowerCase();
  if (t.includes("very busy") || t.includes("packed") || t.includes("crowded")) return "High";
  if (t.includes("quiet") || t.includes("empty") || t.includes("not busy")) return "Low";
  if (t.includes("busy") || t.includes("moderate") || t.includes("medium")) return "Medium";
  return null;
}

export function extractParkingStatus(text) {
  const t = text.toLowerCase();
  if (t.includes("parking full") || t.includes("no parking") || t.includes("full")) return "Full";
  if (t.includes("parking limited") || t.includes("limited parking") || t.includes("limited")) return "Limited";
  if (t.includes("parking available") || t.includes("plenty") || t.includes("available")) return "Available";
  return null;
}

export function extractEvStatus(text) {
  const t = text.toLowerCase();
  if (t.includes("ev not working") || t.includes("ev out of order") || t.includes("charger broken") || t.includes("chargers not working") || t.includes("out of order")) return "OutOfOrder";
  if (t.includes("some ev") || t.includes("some charger") || t.includes("some broken")) return "SomeBroken";
  if (t.includes("ev working") || t.includes("charger working") || t.includes("ev available")) return "Working";
  if (t.includes("no ev") || t.includes("no charger") || t.includes("no electric")) return "NoEV";
  return null;
}

export function extractStationName(text) {
  // "report for Reading Services" / "create report for Heston"
  const m1 = text.match(/(?:report\s+(?:for\s+)?|create\s+report\s+(?:for\s+)?)(.+?)(?:\s*,|\s+\d|\s+(?:one|two|three|four|five)\s+star|$)/i);
  if (m1) {
    const c = m1[1].trim();
    if (c.length > 2 && !["a", "an", "the"].includes(c.toLowerCase())) return c;
  }
  // "find Shell" / "search Reading Services"
  const m2 = text.match(/(?:find|search|look for|locate)\s+(.+?)(?:\s+near|\s+station|$)/i);
  if (m2) return m2[1].trim();
  return null;
}

export function extractComment(text) {
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 1];
  const cleaned = text
    .replace(/(\w+)\s*(?:out of|\/)\s*5/gi, "")
    .replace(/(\w+)\s+stars?/gi, "")
    .replace(/(?:report\s+(?:for\s+)?|create\s+report\s+(?:for\s+)?)\S+/gi, "")
    .replace(/hey\s+bexxa/gi, "")
    .trim();
  if (cleaned.length > 8) return cleaned;
  return null;
}

export function stripWakePhrase(text) {
  return text
    .replace(/^\s*(?:hey|hi|ok|okay)\s+(?:bexxa|bexa|becca|becka)\b[,:\s]*/i, "")
    .replace(/^\s*(?:bexxa|bexa)\b[,:\s]*/i, "")
    .trim();
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useBexxaCommands({ navigate, onReportData }) {
  const [cmdState, setCmdState]     = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [statusMsg, setStatusMsg]   = useState("");

  const recognitionRef   = useRef(null);
  const navigateRef      = useRef(navigate);
  const onReportDataRef  = useRef(onReportData);
  const processRef       = useRef(null); // filled below

  // Keep refs in sync
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { onReportDataRef.current = onReportData; }, [onReportData]);

  // ── speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      synth.cancel();
      synth.speak(u);
    } catch (_) {}
  }, []);

  // ── processCommand ────────────────────────────────────────────────────────
  // Defined as a regular function stored in a ref — always latest, no stale closures
  const processCommand = useCallback((rawText) => {
    if (!rawText) return;
    const nav          = navigateRef.current;
    const reportDataCb = onReportDataRef.current;

    const clean = stripWakePhrase(rawText);
    const t     = clean.toLowerCase();

    setCmdState("processing");
    setStatusMsg("Processing...");

    // ── Navigation ──────────────────────────────────────────────────────────
    if (t.includes("go home") || t === "home" || t.includes("take me home")) {
      speak("Going home."); nav("/"); setCmdState("done"); setStatusMsg("Done"); return;
    }
    if (t.includes("nearby") || t.includes("nearest station") || t.includes("find station") || t.includes("show station")) {
      speak("Opening nearby stations."); nav("/nearby"); setCmdState("done"); setStatusMsg("Done"); return;
    }
    if ((t.includes("create report") || t.includes("open report") || t.includes("new report")) && !extractStationName(clean)) {
      speak("Opening create report."); nav("/reports/create"); setCmdState("done"); setStatusMsg("Done"); return;
    }

    // ── Report intent ───────────────────────────────────────────────────────
    const isReportIntent =
      t.includes("report") || t.includes("stars") ||
      t.includes("out of") || t.includes("rating") ||
      t.includes("busy") || t.includes("parking") ||
      t.includes("ev") || t.includes("charger");

    if (isReportIntent) {
      const stationName       = extractStationName(clean);
      const cleanlinessRating = extractRating(t);
      const busyLevel         = extractBusyLevel(t);
      const parkingStatus     = extractParkingStatus(t);
      const evStatus          = extractEvStatus(t);
      const comment           = extractComment(clean);

      const extracted = {};
      if (stationName)       extracted.stationName       = stationName;
      if (cleanlinessRating) extracted.cleanlinessRating = cleanlinessRating;
      if (busyLevel)         extracted.busyLevel         = busyLevel;
      if (parkingStatus)     extracted.parkingStatus     = parkingStatus;
      if (evStatus)          extracted.evStatus          = evStatus;
      if (comment)           extracted.comment           = comment;

      if (Object.keys(extracted).length === 0) {
        setCmdState("error");
        setStatusMsg("Couldn't understand. Try: 'Report for Heston, 4 stars, clean'");
        speak("I couldn't understand. Please try again.");
        return;
      }

      const parts = [
        stationName       && `Station: ${stationName}`,
        cleanlinessRating && `Rating: ${cleanlinessRating}★`,
        busyLevel         && `Busy: ${busyLevel}`,
      ].filter(Boolean);

      setCmdState("done");
      setStatusMsg(parts.join(" · ") || "Form filled");
      speak(
        `Got it.${stationName ? ` Looking up ${stationName}.` : ""}${cleanlinessRating ? ` Rating ${cleanlinessRating} stars.` : ""} Please review and submit.`
      );

      // If we're already on the report page, fill via callback
      if (reportDataCb) {
        reportDataCb(extracted);
      }

      // If not on report page, navigate there with the data
      if (!window.location.pathname.includes("/reports/create")) {
        nav("/reports/create", { state: { bexxaData: extracted } });
      }
      return;
    }

    // ── Station search ──────────────────────────────────────────────────────
    const stationName = extractStationName(clean);
    if (stationName) {
      speak(`Searching for ${stationName}.`);
      nav("/nearby");
      setCmdState("done");
      setStatusMsg(`Searching: ${stationName}`);
      return;
    }

    setCmdState("error");
    setStatusMsg("Command not recognized");
    speak("Sorry, I didn't understand. Try: find nearby stations, create report, or go home.");
  }, [speak]); // only depends on speak (stable)

  // Store processCommand in ref so startCommandListening closure never goes stale
  useEffect(() => { processRef.current = processCommand; }, [processCommand]);

  // ── startCommandListening ─────────────────────────────────────────────────
  const startCommandListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setCmdState("error"); setStatusMsg("Speech recognition not supported. Use Chrome or Edge."); return; }

    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;

    const recognition = new SR();
    recognition.lang            = "en-US";
    recognition.continuous      = false;
    recognition.interimResults  = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setCmdState("listening");
      setStatusMsg("Listening for command...");
    };

    recognition.onresult = (ev) => {
      const text = Array.from(ev.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      setTranscript(text);
      // Use ref so we always call the latest processCommand
      processRef.current?.(text);
    };

    recognition.onend = () => {
      setCmdState((s) => (s === "listening" ? "idle" : s));
    };

    recognition.onerror = (ev) => {
      const err = ev?.error;
      if (err === "not-allowed") {
        setCmdState("error"); setStatusMsg("Mic permission denied.");
      } else if (err === "no-speech") {
        setCmdState("idle"); setStatusMsg("No speech detected.");
      } else {
        setCmdState("error"); setStatusMsg("Speech error. Try again.");
      }
    };

    recognitionRef.current = recognition;
    setTranscript("");
    try { recognition.start(); } catch (_) {}
  }, []); // no deps — uses refs only, stable identity

  // ── stopCommandListening ──────────────────────────────────────────────────
  const stopCommandListening = useCallback(() => {
    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;
    setCmdState("idle");
    setStatusMsg("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch (_) {}
    };
  }, []);

  return {
    cmdState, setCmdState,
    transcript, setTranscript,
    statusMsg, setStatusMsg,
    startCommandListening,
    stopCommandListening,
    speak,
  };
}
