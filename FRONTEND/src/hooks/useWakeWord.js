/**
 * useWakeWord — browser wake-word detection via continuous SpeechRecognition loop.
 *
 * Key fixes vs previous version:
 *  - All refs declared before use — no stale closure issues
 *  - startWakeWord stored in a ref so the restart loop always calls the latest version
 *  - onWakeWord stored in a ref so it never causes stale callback problems
 *  - enabled stored in a ref (not just state) so onend/onerror closures always see current value
 */

import { useRef, useState, useCallback, useEffect } from "react";

const WAKE_PHRASES = [
  "hey bexxa", "hey bexa", "hey becca", "hey becka",
  "ok bexxa", "okay bexxa", "hi bexxa",
];

export function useWakeWord({ onWakeWord, enabled }) {
  const [wakeState, setWakeState] = useState("off");

  // ── Refs (declared first so closures below can reference them) ────────────
  const recognitionRef   = useRef(null);
  const enabledRef       = useRef(enabled);
  const wakeStateRef     = useRef("off");
  const restartTimerRef  = useRef(null);
  const onWakeWordRef    = useRef(onWakeWord);
  const startWakeWordRef = useRef(null); // filled below

  // Keep refs in sync with latest props/state
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onWakeWordRef.current = onWakeWord; }, [onWakeWord]);
  useEffect(() => { wakeStateRef.current = wakeState; }, [wakeState]);

  // ── stopWakeWord ──────────────────────────────────────────────────────────
  const stopWakeWord = useCallback(() => {
    clearTimeout(restartTimerRef.current);
    enabledRef.current = false;
    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;
    setWakeState("off");
    wakeStateRef.current = "off";
  }, []);

  // ── startWakeWord ─────────────────────────────────────────────────────────
  const startWakeWord = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setWakeState("unsupported");
      wakeStateRef.current = "unsupported";
      return;
    }

    // Abort any existing instance cleanly
    clearTimeout(restartTimerRef.current);
    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;

    if (!enabledRef.current) return;

    const recog = new SR();
    recog.lang            = "en-US";
    recog.continuous      = false; // restart manually — more reliable in Chrome
    recog.interimResults  = true;  // interim lets us catch wake phrase faster
    recog.maxAlternatives = 3;

    recog.onstart = () => {
      if (!enabledRef.current) { recog.abort(); return; }
      setWakeState("listening");
      wakeStateRef.current = "listening";
    };

    recog.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        for (let j = 0; j < ev.results[i].length; j++) {
          const t = ev.results[i][j].transcript.toLowerCase().trim();
          if (WAKE_PHRASES.some((p) => t.includes(p))) {
            // Stop wake loop, fire callback
            try { recog.abort(); } catch (_) {}
            recognitionRef.current = null;
            setWakeState("detected");
            wakeStateRef.current = "detected";
            onWakeWordRef.current?.();
            return;
          }
        }
      }
    };

    recog.onend = () => {
      // Only restart if we're still in "listening" state (not "detected")
      if (enabledRef.current && wakeStateRef.current === "listening") {
        restartTimerRef.current = setTimeout(() => {
          if (enabledRef.current && startWakeWordRef.current) {
            startWakeWordRef.current();
          }
        }, 250);
      }
    };

    recog.onerror = (ev) => {
      const err = ev?.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        enabledRef.current = false;
        setWakeState("error");
        wakeStateRef.current = "error";
        return;
      }
      // "no-speech", "aborted", "network" — restart silently
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (enabledRef.current && startWakeWordRef.current) {
            startWakeWordRef.current();
          }
        }, 400);
      }
    };

    recognitionRef.current = recog;
    try {
      recog.start();
    } catch (_) {
      // "already started" — ignore
    }
  }, []); // no deps — uses refs only

  // Store latest startWakeWord in ref so onend/onerror closures always call the current version
  useEffect(() => {
    startWakeWordRef.current = startWakeWord;
  }, [startWakeWord]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(restartTimerRef.current);
      enabledRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
    };
  }, []);

  return { wakeState, setWakeState, startWakeWord, stopWakeWord };
}
