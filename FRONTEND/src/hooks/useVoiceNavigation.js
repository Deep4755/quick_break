/**
 * useVoiceNavigation — reliable voice guidance using continuous SpeechRecognition.
 *
 * Key fix: uses continuous:true so the mic stays open permanently.
 * No restart loops = no broken mic state.
 */
import { useState, useRef, useCallback, useEffect } from "react";

// ── TTS ────────────────────────────────────────────────────────────────────────
function ttsSpeak(text, onDone) {
  const synth = window.speechSynthesis;
  if (!synth) { onDone?.(); return; }
  synth.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang   = "en-GB";
  u.rate   = 1.0;
  u.volume = 1;

  let fired = false;
  const done = () => { if (!fired) { fired = true; onDone?.(); } };
  u.onend   = done;
  u.onerror = done;
  synth.speak(u);
  // Safety timeout
  setTimeout(done, Math.max(5000, text.length * 90));
}

function ttsStop() {
  try { window.speechSynthesis?.cancel(); } catch (_) {}
}

// ── Command parser ─────────────────────────────────────────────────────────────
function parseCmd(raw) {
  const t = raw.toLowerCase()
    .replace(/^\s*(?:hey|hi|ok|okay)\s+(?:bexxa|bexa|becca|alexa)\b[,:\s]*/i, "")
    .replace(/^\s*(?:bexxa|bexa)\b[,:\s]*/i, "")
    .trim();

  if (/\b(start|begin)\b/.test(t))                    return "start";
  if (/\bnext(\s+step)?\b/.test(t))                   return "next";
  if (/\b(repeat|again|say again)\b/.test(t))         return "repeat";
  if (/\b(pause|stop (talking|speaking))\b/.test(t))  return "pause";
  if (/\b(resume|continue|unpause)\b/.test(t))        return "resume";
  if (/\b(stop|end|cancel|finish)\b/.test(t))         return "stop";
  return null;
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export default function useVoiceNavigation({ steps = [], station, routeData }) {
  const [status,      setStatus]      = useState("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive,    setIsActive]    = useState(false);
  const [isPaused,    setIsPaused]    = useState(false);
  const [transcript,  setTranscript]  = useState("");

  // All live state in refs — safe inside SR callbacks
  const srRef         = useRef(null);
  const isActiveRef   = useRef(false);
  const isPausedRef   = useRef(false);
  const stepRef       = useRef(0);
  const stepsRef      = useRef(steps);
  const stationRef    = useRef(station);
  const routeRef      = useRef(routeData);
  const speakingRef   = useRef(false);   // true while TTS is playing

  useEffect(() => { stepsRef.current  = steps;     }, [steps]);
  useEffect(() => { stationRef.current = station;  }, [station]);
  useEffect(() => { routeRef.current  = routeData; }, [routeData]);

  // ── Speak one step ────────────────────────────────────────────────────────────
  const speakStep = useCallback((idx) => {
    const step = stepsRef.current[idx];
    if (!step) return;
    speakingRef.current = true;
    setStatus("speaking");
    ttsSpeak(step.message, () => {
      speakingRef.current = false;
      if (isActiveRef.current && !isPausedRef.current) setStatus("listening");
    });
  }, []);

  // ── Handle a parsed command ───────────────────────────────────────────────────
  const execCmd = useCallback((cmd) => {
    console.log("[VoiceNav] exec:", cmd);
    const steps = stepsRef.current;

    switch (cmd) {
      case "next": {
        const next = Math.min(stepRef.current + 1, steps.length - 1);
        stepRef.current = next;
        setCurrentStep(next);
        speakStep(next);
        break;
      }
      case "repeat":
        speakStep(stepRef.current);
        break;
      case "pause":
        isPausedRef.current = true;
        setIsPaused(true);
        setStatus("paused");
        ttsStop();
        // Keep SR running so "resume" can be heard — just stop TTS
        ttsSpeak("Guidance paused. Say resume to continue.");
        break;      case "resume":
        if (!isActiveRef.current) return;
        isPausedRef.current = false;
        setIsPaused(false);
        speakStep(stepRef.current);
        break;
      case "stop":
        stopGuidance();
        break;
      default:
        break;
    }
  }, [speakStep]); // eslint-disable-line

  // ── Start continuous SR ───────────────────────────────────────────────────────
  const startSR = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.warn("[VoiceNav] SpeechRecognition not supported"); return; }

    // Stop any existing instance
    try { srRef.current?.stop(); } catch (_) {}

    const r = new SR();
    r.lang            = "en-GB";
    r.continuous      = true;   // KEY: stay open permanently
    r.interimResults  = false;
    r.maxAlternatives = 3;
    srRef.current = r;

    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (!ev.results[i].isFinal) continue;
        const text = ev.results[i][0].transcript.trim();
        if (!text) continue;
        console.log("[VoiceNav] heard:", text);
        setTranscript(text);
        const cmd = parseCmd(text);
        // When paused, only allow "resume" and "stop"
        if (isPausedRef.current) {
          if (cmd === "resume" || cmd === "stop") execCmd(cmd);
        } else {
          if (cmd) execCmd(cmd);
        }
      }
    };

    r.onerror = (ev) => {
      console.log("[VoiceNav] SR error:", ev.error);
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setStatus("error"); return;
      }
      // Keep SR alive regardless of pause state
      if (isActiveRef.current) {
        setTimeout(() => { if (isActiveRef.current) startSR(); }, 1500);
      }
    };

    r.onend = () => {
      // Restart if still active (paused or listening — we need SR alive in both states)
      if (isActiveRef.current) {
        setTimeout(() => { if (isActiveRef.current) startSR(); }, 500);
      }
    };

    try {
      r.start();
      console.log("[VoiceNav] SR started (continuous)");
    } catch (e) {
      console.warn("[VoiceNav] SR start failed:", e.message);
      setTimeout(() => { if (isActiveRef.current) startSR(); }, 1000);
    }
  }, [execCmd]);

  // ── Start guidance ────────────────────────────────────────────────────────────
  const startGuidance = useCallback(() => {
    const steps = stepsRef.current;
    if (!steps.length) { console.warn("[VoiceNav] no steps available"); return; }

    isActiveRef.current = true;
    isPausedRef.current = false;
    stepRef.current     = 0;

    setIsActive(true);
    setIsPaused(false);
    setCurrentStep(0);
    setStatus("speaking");

    const dest = stationRef.current?.name || "your destination";
    const mins = routeRef.current ? Math.floor(routeRef.current.durationSeconds / 60) : null;
    const intro = [
      `Navigation to ${dest} started.`,
      mins ? `Estimated time is ${mins} minutes.` : "",
      steps[0]?.message || "",
    ].filter(Boolean).join(" ");

    speakingRef.current = true;
    ttsSpeak(intro, () => {
      speakingRef.current = false;
      if (isActiveRef.current && !isPausedRef.current) {
        setStatus("listening");
        startSR();
      }
    });
  }, [startSR, speakStep]); // eslint-disable-line

  // ── Stop guidance ─────────────────────────────────────────────────────────────
  const stopGuidance = useCallback(() => {
    isActiveRef.current = false;
    isPausedRef.current = false;
    speakingRef.current = false;

    setIsActive(false);
    setIsPaused(false);
    setCurrentStep(0);
    setTranscript("");
    stepRef.current = 0;

    ttsStop();
    try { srRef.current?.stop(); srRef.current = null; } catch (_) {}

    setStatus("stopped");
    ttsSpeak("Navigation stopped.");
    setTimeout(() => setStatus("idle"), 2500);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsStop();
      try { srRef.current?.stop(); } catch (_) {}
    };
  }, []);

  return {
    status,
    currentStep,
    isActive,
    isPaused,
    transcript,
    startGuidance,
    stopGuidance,
    nextStep:       () => execCmd("next"),
    repeatStep:     () => execCmd("repeat"),
    pauseGuidance:  () => execCmd("pause"),
    resumeGuidance: () => execCmd("resume"),
  };
}
