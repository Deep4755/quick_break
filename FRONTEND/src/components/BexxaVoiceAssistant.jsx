import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── Wake phrases (all Chrome mishearings of "Hey Bexxa") ─────────────────────
const WAKE_PHRASES = [
  "hey bexxa","hey bexa","hey becca","hey becka","ok bexxa","okay bexxa","hi bexxa",
  "hey alexa","hey alexia","hey alex","ok alexa","okay alexa","hi alexa",
  "a bexxa","a becca","hey vexxa","hey vexa",
];

const WORD_TO_NUM = { one:1,two:2,three:3,four:4,five:5,"1":1,"2":2,"3":3,"4":4,"5":5 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isWakePhrase(txt) {
  const t = txt.toLowerCase().trim();
  return WAKE_PHRASES.some(function(p) { return t.includes(p); });
}

function stripWake(text) {
  return text
    .replace(/^\s*(?:hey|hi|ok|okay)\s+(?:bexxa|bexa|becca|becka|alexa|alexia|alex|vexxa|vexa)\b[,:\s]*/i, "")
    .replace(/^\s*(?:bexxa|bexa|alexa|alexia|vexxa)\b[,:\s]*/i, "")
    .trim();
}

function extractRating(t) {
  const m1 = t.match(/(\w+)\s*(?:out of|\/)\s*5/i);
  if (m1 && WORD_TO_NUM[m1[1].toLowerCase()]) return WORD_TO_NUM[m1[1].toLowerCase()];
  const m2 = t.match(/(\w+)\s+stars?/i);
  if (m2 && WORD_TO_NUM[m2[1].toLowerCase()]) return WORD_TO_NUM[m2[1].toLowerCase()];
  return null;
}
function extractBusyLevel(t) {
  if (t.includes("very busy")||t.includes("packed")) return "High";
  if (t.includes("quiet")||t.includes("empty")||t.includes("not busy")) return "Low";
  if (t.includes("busy")||t.includes("moderate")) return "Medium";
  return null;
}
function extractParkingStatus(t) {
  if (t.includes("parking full")||t.includes("no parking")) return "Full";
  if (t.includes("limited")) return "Limited";
  if (t.includes("parking available")||t.includes("available")) return "Available";
  return null;
}
function extractEvStatus(t) {
  if (t.includes("out of order")||t.includes("charger broken")) return "OutOfOrder";
  if (t.includes("some ev")||t.includes("some broken")) return "SomeBroken";
  if (t.includes("ev working")||t.includes("charger working")) return "Working";
  if (t.includes("no ev")||t.includes("no charger")) return "NoEV";
  return null;
}
function extractStationName(text) {
  const m = text.match(/(?:report\s+(?:for\s+)?|create\s+report\s+(?:for\s+)?)(.+?)(?:\s*,|\s+\d|\s+(?:one|two|three|four|five)\s+star|$)/i);
  if (m) { const c = m[1].trim(); if (c.length > 2 && !["a","an","the","me","please"].includes(c.toLowerCase())) return c; }
  return null;
}
function extractComment(text) {
  const parts = text.split(",").map(function(p) { return p.trim(); }).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 1];
  return null;
}

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2-lat1)*Math.PI)/180;
  const dLon = ((lon2-lon1)*Math.PI)/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function kmToMi(km) { return (km*0.621371).toFixed(1); }

function buildMapsUrl(station, userCoords) {
  const coords = station && station.location && station.location.coordinates;
  if (!coords) return null;
  const lng = coords[0];
  const lat = coords[1];
  if (userCoords) {
    return "https://www.google.com/maps/dir/?api=1"
      + "&origin=" + userCoords.lat + "," + userCoords.lng
      + "&destination=" + lat + "," + lng
      + "&travelmode=driving";
  }
  return "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng;
}

// ─── TTS — waits for voices, then speaks ─────────────────────────────────────
function speak(text, onDone) {
  try {
    const s = window.speechSynthesis;
    if (!s) { if (onDone) onDone(); return; }
    s.cancel();
    const doSpeak = function() {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.volume = 1;
      let fired = false;
      const done = function() { if (!fired) { fired = true; if (onDone) onDone(); } };
      u.onend = done; u.onerror = done;
      s.speak(u);
      setTimeout(done, 4000);
    };
    // Chrome needs voices loaded — if empty, wait for voiceschanged
    const voices = s.getVoices();
    if (voices && voices.length > 0) {
      doSpeak();
    } else {
      s.onvoiceschanged = function() { s.onvoiceschanged = null; doSpeak(); };
      // Fallback if voiceschanged never fires
      setTimeout(doSpeak, 500);
    }
  } catch(e) { if (onDone) onDone(); }
}

// ─── UI ───────────────────────────────────────────────────────────────────────
function MicIcon({ pulse, size }) {
  size = size || 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      className={pulse ? "animate-pulse" : ""} aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/>
      <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
    </svg>
  );
}

const STATUS_STYLE = {
  off:           { bg:"#f5f7f5",               border:"#e5e7eb",               text:"#9ca3af" },
  wake_listening:{ bg:"rgba(26,122,74,0.08)",  border:"rgba(26,122,74,0.25)",  text:"#1a7a4a" },
  wake_detected: { bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", text:"#d97706" },
  cmd_listening: { bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  text:"#dc2626" },
  processing:    { bg:"rgba(26,122,74,0.08)",  border:"rgba(26,122,74,0.25)",  text:"#1a7a4a" },
  done:          { bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.25)", text:"#059669" },
  error:         { bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  text:"#dc2626" },
};
const STATUS_LABEL = {
  off:           "Idle",
  wake_listening:'Listening for "Hey Bexxa"',
  wake_detected: "Wake word detected!",
  cmd_listening: "Listening for command...",
  processing:    "Processing...",
  done:          "Done",
  error:         "Error",
};

function StatusChip({ status, label }) {
  const c = STATUS_STYLE[status] || STATUS_STYLE.off;
  return (
    <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
      style={{ background:c.bg, border:"1px solid "+c.border, color:c.text }}>
      {label || STATUS_LABEL[status] || status}
    </span>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="relative rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ width:40, height:22,
        background: on ? "linear-gradient(135deg,#1a7a4a,#22a05e)" : "#e5e7eb",
        border:"1px solid #c8d5c8" }}
      aria-label={on ? "Disable hands-free" : "Enable hands-free"}>
      <span className="absolute rounded-full bg-white transition-transform duration-200"
        style={{ width:16, height:16, top:3, transform: on ? "translateX(20px)" : "translateX(2px)" }}/>
    </button>
  );
}

function Ripple({ active, color }) {
  color = color || "#1a7a4a";
  if (!active) return null;
  return (
    <>
      {[1,2,3].map(function(i) {
        return (
          <span key={i} className="absolute rounded-full pointer-events-none" style={{
            inset:"-"+(i*10)+"px", border:"1.5px solid "+color,
            opacity:0.18/i,
            animation:"ping "+(0.9+i*0.3)+"s cubic-bezier(0,0,0.2,1) infinite",
            animationDelay:(i*0.2)+"s",
          }}/>
        );
      })}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BexxaVoiceAssistant({ mode, onReportData }) {
  mode = mode || "home";
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus]         = useState("off");       // off | wake_listening | wake_detected | cmd_listening | processing | done | error
  const [transcript, setTranscript] = useState("");
  const [response, setResponse]     = useState("");          // what Bexxa says
  const [mapsUrl, setMapsUrl]       = useState(null);        // set when directions are ready
  const [lastStation, setLastStation] = useState(null);      // last found station for action buttons
  const [handsFree, setHandsFree]   = useState(
    function() { return sessionStorage.getItem("qb_handsfree") === "true"; }
  );

  // ── Refs (mutable, no re-render needed) ───────────────────────────────────
  const srRef         = useRef(null);   // active SR instance
  const statusRef     = useRef("off");  // mirror of status for use inside callbacks
  const hfRef         = useRef(handsFree);
  const timerRef      = useRef(null);
  const userCoordsRef = useRef(null);
  const reportCbRef   = useRef(onReportData);

  // Keep refs in sync
  useEffect(function() { statusRef.current  = status;      }, [status]);
  useEffect(function() { hfRef.current      = handsFree;   }, [handsFree]);
  useEffect(function() { reportCbRef.current = onReportData; }, [onReportData]);

  // Cache user location once on mount
  useEffect(function() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      function(pos) { userCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
      function() {},
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  // ── Core SR control ────────────────────────────────────────────────────────
  function stopAllListening() {
    clearTimeout(timerRef.current);
    const r = srRef.current;
    if (!r) return;
    srRef.current = null;
    try { r.onstart=null; r.onresult=null; r.onend=null; r.onerror=null; } catch(e){}
    try { r.abort(); } catch(e){}
  }

  function setStatusSync(s) {
    statusRef.current = s;
    setStatus(s);
  }

  // ── Reset back to wake listening after an action ───────────────────────────
  function resetToWakeMode(delay) {
    delay = delay || 2000;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(function() {
      if (hfRef.current) startWakeListening();
    }, delay);
  }

  // ── Show result and optionally return to wake mode ─────────────────────────
  function showResult(msg, url, station) {
    setStatusSync("done");
    setResponse(msg);
    if (url) setMapsUrl(url);
    if (station) setLastStation(station);
    if (hfRef.current) resetToWakeMode(3000);
  }

  function showError(msg) {
    setStatusSync("error");
    setResponse(msg);
    if (hfRef.current) resetToWakeMode(2500);
  }

  // ── Parse and handle one command ──────────────────────────────────────────
  async function handleCommand(rawText) {
    const clean = stripWake(rawText);
    const t = clean.toLowerCase();
    console.log("[Bexxa CMD]", clean);

    setStatusSync("processing");
    setMapsUrl(null);

    // Go home
    if (t.includes("go home") || t === "home") {
      navigate("/");
      showResult("Going home."); return;
    }

    // Open nearby page
    if (t.includes("open nearby") || t.includes("show nearby") || t.includes("show stations")) {
      navigate("/nearby");
      showResult("Opening nearby stations."); return;
    }

    // Open create report (no station)
    if ((t.includes("create report") || t.includes("open report") || t.includes("new report"))
        && !extractStationName(clean)) {
      navigate("/reports/create");
      showResult("Opening create report."); return;
    }

    // Directions — use last found station
    if (t.includes("direction") || t.includes("navigate") || t.includes("open map") || t.includes("take me there")) {
      if (lastStation) {
        const url = buildMapsUrl(lastStation, userCoordsRef.current);
        if (url) { showResult("Tap Open in Maps to navigate to " + lastStation.name + ".", url, lastStation); }
        else     { showError("No coordinates for that station."); }
      } else {
        showError("No station selected. Try: find nearest station first.");
      }
      return;
    }

    // View details — use last found station
    if (t.includes("detail") || t.includes("show detail") || t.includes("tell me more")) {
      if (lastStation) {
        navigate("/stations/" + lastStation._id);
        showResult("Opening details for " + lastStation.name + ".");
      } else {
        showError("No station selected. Try: find nearest station first.");
      }
      return;
    }

    // Find EV charging — go to nearby page
    if (t.includes("ev charging") || t.includes("electric") || t.includes("ev charger") || t.includes("charge my car")) {
      navigate("/nearby");
      speak("Here you go! Do you need any more help?");
      showResult("Here you go! Opening nearby stations."); return;
    }

    // Find nearest / nearby — go to nearby page
    if (t.includes("nearby") || t.includes("nearest") || t.includes("find station") ||
        t.includes("closest") || t.includes("find me a station")) {
      navigate("/nearby");
      speak("Here you go! Do you need any more help?");
      showResult("Here you go! Opening nearby stations."); return;
    }

    // Brand search — go to nearby page
    const brandMatch = t.match(/find\s+(shell|bp|esso|texaco|moto|welcome break|roadchef|extra)/i);
    if (brandMatch) {
      navigate("/nearby");
      speak("Here you go! Do you need any more help?");
      showResult("Here you go! Opening nearby stations."); return;
    }

    // Report with data
    const isReport = t.includes("report") || t.includes("stars") || t.includes("out of") ||
                     t.includes("rating") || t.includes("busy") || t.includes("parking");
    if (isReport) {
      const stationName       = extractStationName(clean);
      const cleanlinessRating = extractRating(t);
      const busyLevel         = extractBusyLevel(t);
      const parkingStatus     = extractParkingStatus(t);
      const evStatus          = extractEvStatus(t);
      const comment           = extractComment(clean);
      const data = {};
      if (stationName)       data.stationName       = stationName;
      if (cleanlinessRating) data.cleanlinessRating = cleanlinessRating;
      if (busyLevel)         data.busyLevel         = busyLevel;
      if (parkingStatus)     data.parkingStatus     = parkingStatus;
      if (evStatus)          data.evStatus          = evStatus;
      if (comment)           data.comment           = comment;
      if (Object.keys(data).length) {
        if (reportCbRef.current) reportCbRef.current(data);
        if (!window.location.pathname.includes("/reports/create")) {
          navigate("/reports/create", { state: { bexxaData: data } });
        }
        showResult("Form filled. Please review and submit."); return;
      }
    }

    // Help / fallback
    showError("Try: find nearest station, find EV charging, directions, create report, or go home.");
  }

  // ── Wake word listening ────────────────────────────────────────────────────
  function startWakeListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !hfRef.current) return;
    stopAllListening();

    const r = new SR();
    r.lang = "en-GB"; r.continuous = false; r.interimResults = true; r.maxAlternatives = 5;
    srRef.current = r;

    r.onstart = function() {
      if (!hfRef.current) { stopAllListening(); return; }
      setStatusSync("wake_listening");
    };

    r.onresult = function(ev) {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        for (let j = 0; j < ev.results[i].length; j++) {
          const txt = ev.results[i][j].transcript.toLowerCase().trim();
          console.log("[Bexxa WAKE]", txt);
          if (isWakePhrase(txt)) {
            // 1. Detach and abort wake SR
            srRef.current = null;
            try { r.onresult=null; r.onend=null; r.onerror=null; r.abort(); } catch(e){}
            console.log("[Bexxa] wake word detected");
            setStatusSync("wake_detected");
            setResponse("Yes? What would you like?");

            // 2. Wait for SR mic to fully release (Chrome needs ~300ms), then speak
            setTimeout(function() {
              console.log("[Bexxa] speaking acknowledgement");
              const s = window.speechSynthesis;
              if (!s) {
                // No TTS — go straight to command listening
                if (hfRef.current) startCommandListening();
                return;
              }
              let fired = false;
              const afterSpeak = function() {
                if (fired) return;
                fired = true;
                clearTimeout(timerRef.current);
                console.log("[Bexxa] acknowledgement done, starting command listening");
                // Small gap so mic hardware switches from output back to input
                setTimeout(function() {
                  if (hfRef.current) startCommandListening();
                }, 300);
              };
              const u = new SpeechSynthesisUtterance("Yes?");
              u.rate = 1.0;
              u.volume = 1;
              u.onend   = afterSpeak;
              u.onerror = afterSpeak;
              s.speak(u);
              // Safety: if onend never fires within 4s, proceed anyway
              timerRef.current = setTimeout(afterSpeak, 4000);
            }, 400);
            return;
          }
        }
      }
    };

    r.onend = function() {
      // Restart wake loop if still in hands-free mode
      if (hfRef.current && statusRef.current === "wake_listening") {
        timerRef.current = setTimeout(function() { if (hfRef.current) startWakeListening(); }, 200);
      }
    };

    r.onerror = function(ev) {
      const err = ev && ev.error;
      if (err === "aborted") return;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setStatusSync("error"); setResponse("Mic permission denied.");
        hfRef.current = false; setHandsFree(false);
        sessionStorage.removeItem("qb_handsfree"); return;
      }
      // no-speech / network — just restart
      if (hfRef.current) {
        timerRef.current = setTimeout(function() { if (hfRef.current) startWakeListening(); }, 400);
      }
    };

    try { r.start(); } catch(e) {
      timerRef.current = setTimeout(function() { if (hfRef.current) startWakeListening(); }, 600);
    }
  }

  // ── Command listening (one shot) ───────────────────────────────────────────
  function startCommandListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatusSync("error"); setResponse("Not supported. Use Chrome or Edge."); return; }
    stopAllListening();

    const r = new SR();
    r.lang = "en-GB"; r.continuous = false; r.interimResults = false; r.maxAlternatives = 3;
    srRef.current = r;

    r.onstart = function() { setStatusSync("cmd_listening"); };

    r.onresult = function(ev) {
      let best = ""; let bestConf = -1;
      for (let i = 0; i < ev.results.length; i++) {
        for (let j = 0; j < ev.results[i].length; j++) {
          if (ev.results[i][j].confidence > bestConf) {
            bestConf = ev.results[i][j].confidence;
            best = ev.results[i][j].transcript;
          }
        }
      }
      const text = best.trim();
      if (text) { setTranscript(text); handleCommand(text); }
    };

    r.onend = function() {
      if (statusRef.current === "cmd_listening") {
        showError("No speech detected. Try again.");
      }
    };

    r.onerror = function(ev) {
      const err = ev && ev.error;
      if (err === "aborted") return;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setStatusSync("error"); setResponse("Mic permission denied."); return;
      }
      showError(err === "no-speech" ? "No speech detected." : "Mic error: " + err);
    };

    try { r.start(); } catch(e) {
      setStatusSync("error"); setResponse("Could not start mic.");
    }
  }

  // ── Hands-free toggle ──────────────────────────────────────────────────────
  function toggleHandsFree() {
    if (handsFree) {
      stopAllListening();
      hfRef.current = false;
      setHandsFree(false);
      sessionStorage.removeItem("qb_handsfree");
      setStatusSync("off");
    } else {
      hfRef.current = true;
      setHandsFree(true);
      sessionStorage.setItem("qb_handsfree", "true");
      // Speak from user gesture to unlock Chrome TTS, THEN start wake listening after speech ends
      try {
        const s = window.speechSynthesis;
        if (s) {
          s.cancel();
          const u = new SpeechSynthesisUtterance("Ready. Say Hey Bexxa.");
          u.rate = 1.1;
          u.onend = function() {
            if (hfRef.current) startWakeListening();
          };
          u.onerror = function() {
            if (hfRef.current) startWakeListening();
          };
          s.speak(u);
          // Fallback if onend never fires
          timerRef.current = setTimeout(function() { if (hfRef.current) startWakeListening(); }, 3000);
          return;
        }
      } catch(e) {}
      // No TTS available — start wake listening directly
      timerRef.current = setTimeout(function() { if (hfRef.current) startWakeListening(); }, 150);
    }
  }

  // ── Manual talk button ─────────────────────────────────────────────────────
  function handleManualTalk() {
    if (status === "cmd_listening") {
      stopAllListening(); setStatusSync("off"); return;
    }
    stopAllListening();
    setTranscript("");
    startCommandListening();
  }

  // ── Mount: resume wake loop if persisted ──────────────────────────────────
  useEffect(function() {
    if (handsFree) {
      timerRef.current = setTimeout(function() { try { startWakeListening(); } catch(e){} }, 300);
    }
    return function() { stopAllListening(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived display values ─────────────────────────────────────────────────
  const isListeningWake = status === "wake_listening";
  const isListeningCmd  = status === "cmd_listening";
  const isWakeDetected  = status === "wake_detected";
  const micActive       = isListeningCmd || isWakeDetected;

  // ── HOME mode UI ───────────────────────────────────────────────────────────
  if (mode === "home") {
    return (
      <div className="flex flex-col items-center py-2">

        {/* Hands-free toggle */}
        <div className="w-full flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#1a7a4a"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color:"#1a1a1a" }}>Hands-Free Mode</span>
          </div>
          <Toggle on={handsFree} onToggle={toggleHandsFree}/>
        </div>

        {/* Mic button */}
        <div className="relative flex items-center justify-center mb-3" style={{ width:80, height:80 }}>
          <Ripple active={isListeningWake||isListeningCmd||isWakeDetected}
            color={micActive ? "#ef4444" : "#1a7a4a"}/>
          <button type="button" onClick={handleManualTalk} aria-pressed={isListeningCmd}
            className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: micActive
                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : "linear-gradient(135deg,#1a7a4a,#22a05e)",
              boxShadow: micActive
                ? "0 0 0 8px rgba(239,68,68,0.12)"
                : "0 0 0 8px rgba(26,122,74,0.12)",
              zIndex:1,
            }}>
            <MicIcon size={28} pulse={isListeningCmd||isListeningWake}/>
          </button>
        </div>

        {/* Status text */}
        <p className="text-sm font-medium mb-1" style={{ color:"#1a1a1a" }}>
          {isWakeDetected  ? "Hey Bexxa!"
           : isListeningCmd  ? "Listening..."
           : isListeningWake ? "Waiting for wake word"
           : "Ready to help"}
        </p>
        <p className="text-xs mb-3" style={{ color:"#4b5563" }}>
          {handsFree
            ? (isListeningWake ? 'Say "Hey Bexxa" to start' : "Tap mic for manual command")
            : "Tap mic or enable hands-free above"}
        </p>

        <StatusChip status={status}/>

        {/* Bexxa response */}
        {response && (
          <div className="mt-3 w-full rounded-xl px-4 py-3"
            style={{ background:"rgba(26,122,74,0.06)", border:"1px solid rgba(26,122,74,0.15)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color:"#1a7a4a" }}>Bexxa</p>
            <p className="text-sm leading-relaxed" style={{ color:"#1a1a1a" }}>{response}</p>
          </div>
        )}

        {/* Open in Maps button */}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background:"linear-gradient(135deg,#1a7a4a,#22a05e)", textDecoration:"none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
              <circle cx="12" cy="9" r="2.5" fill="#1a7a4a"/>
            </svg>
            Open in Google Maps
          </a>
        )}

        {/* Quick action buttons when a station is found */}
        {lastStation && (
          <div className="mt-2 w-full flex gap-2">
            {mapsUrl && (
              <button type="button"
                onClick={function() { navigate("/stations/" + lastStation._id); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ background:"#f5f7f5", border:"1px solid #e5e7eb", color:"#1a1a1a" }}>
                View Details
              </button>
            )}
            <button type="button"
              onClick={function() { navigate("/reports/create", { state: { stationId: lastStation._id } }); }}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ background:"#f5f7f5", border:"1px solid #e5e7eb", color:"#1a1a1a" }}>
              Create Report
            </button>
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="mt-2 w-full rounded-lg px-3 py-2 text-xs"
            style={{ background:"#f5f7f5", border:"1px solid #e5e7eb", color:"#4b5563" }}>
            <span style={{ color:"#9ca3af" }}>You: </span>{transcript}
          </div>
        )}
      </div>
    );
  }

  // ── REPORT mode UI ─────────────────────────────────────────────────────────
  return (
    <div>
      <p className="text-xs mb-3" style={{ color:"#4b5563" }}>
        Try: <span style={{ color:"#1a7a4a" }}>"Report for Heston Services, 4 stars, clean toilets"</span>
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={handleManualTalk} aria-pressed={isListeningCmd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: isListeningCmd ? "rgba(239,68,68,0.1)" : "#f5f7f5",
            border:"1px solid "+(isListeningCmd ? "rgba(239,68,68,0.3)" : "#e5e7eb"),
            color: isListeningCmd ? "#dc2626" : "#1a1a1a",
          }}>
          <MicIcon size={16} pulse={isListeningCmd}/>
          {isListeningCmd ? "Listening..." : "Talk to Bexxa"}
        </button>

        <StatusChip status={status}/>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color:"#4b5563" }}>Hands-free</span>
          <Toggle on={handsFree} onToggle={toggleHandsFree}/>
        </div>
      </div>

      {response && (
        <div className="mt-3 rounded-xl px-4 py-3"
          style={{ background:"rgba(26,122,74,0.06)", border:"1px solid rgba(26,122,74,0.15)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color:"#1a7a4a" }}>Bexxa</p>
          <p className="text-sm" style={{ color:"#1a1a1a" }}>{response}</p>
        </div>
      )}

      <div className="mt-3 rounded-xl px-4 py-3" style={{ background:"#f5f7f5", border:"1px solid #e5e7eb" }}>
        <p className="text-xs mb-1" style={{ color:"#9ca3af" }}>Transcript</p>
        <p className="text-sm" style={{ color: transcript ? "#1a1a1a" : "#9ca3af" }}>
          {transcript || "No speech captured yet."}
        </p>
      </div>

      {handsFree && (
        <p className="text-xs mt-2" style={{ color:"#4b5563" }}>
          Hands-free on — say <span style={{ color:"#1a7a4a" }}>"Hey Bexxa"</span> then your command
        </p>
      )}
    </div>
  );
}
