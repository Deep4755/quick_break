import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import bexxaApi from "../api/bexxaApi";

// ── icon helpers ──────────────────────────────────────────────────────────────
function FeatureIcon({ iconKey }) {
  const cls = "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0";
  const bg  = "rgba(22,163,74,0.1)";
  const icons = {
    mic:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke="#16a34a" strokeWidth="2"/><path d="M5 10a7 7 0 0 0 14 0" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg>,
    map:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#16a34a" strokeWidth="2"/><circle cx="12" cy="9" r="2.5" stroke="#16a34a" strokeWidth="2"/></svg>,
    bolt:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    route: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="3 11 22 2 13 21 11 13 3 11" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return <div className={cls} style={{ background: bg }}>{icons[iconKey] || icons.map}</div>;
}

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: "1px solid #e5e7eb", background: "#fff" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold" style={{ color: "#111827" }}>{question}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "#6b7280" }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

// ── Station result card ───────────────────────────────────────────────────────
function StationResult({ station }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "#111827" }}>{station.name}</p>
        {station.operator && <p className="text-xs" style={{ color: "#16a34a" }}>{station.operator}</p>}
        {station.address  && <p className="text-xs truncate" style={{ color: "#6b7280" }}>{station.address}</p>}
        {station.distanceMi != null && <p className="text-xs" style={{ color: "#9ca3af" }}>{station.distanceMi} mi away</p>}
      </div>
    </div>
  );
}

// ── AssistantCard ─────────────────────────────────────────────────────────────
function AssistantCard({ prompts, isOnline, inputRef }) {
  const [inputVal, setInputVal]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [response, setResponse]   = useState(null);
  const [stations, setStations]   = useState([]);
  const [listening, setListening] = useState(false);
  const [toastMsg, setToastMsg]   = useState("");
  const recognitionRef = useRef(null);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const submitQuery = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setResponse(null);
    setStations([]);
    try {
      let lat = null, lng = null;
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { /* no location */ }

      const data = await bexxaApi.query(q, lat, lng);
      setResponse(data.response);
      setStations(data.stations || []);
    } catch {
      setResponse("Sorry, I couldn't process that right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrompt = (p) => { setInputVal(p); submitQuery(p); };

  const handleSubmit = (e) => { e.preventDefault(); submitQuery(inputVal); };

  const handleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast("Voice input is not supported in this browser."); return; }

    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }

    const rec = new SpeechRecognition();
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => { setListening(false); showToast("Couldn't hear you. Please try again."); };
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputVal(transcript);
      submitQuery(transcript);
    };
    rec.start();
  };

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #e5e7eb", minWidth: 300 }}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#16a34a" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" fill="white"/>
              <path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#111827" }}>Bexxa Assistant</p>
            <p className="text-xs" style={{ color: "#6b7280" }}>Ready to help</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block animate-pulse"/>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center py-5">
        <button
          onClick={handleMic}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
          style={{
            background: listening ? "#dc2626" : "linear-gradient(135deg, #16a34a, #22a05e)",
            transform: listening ? "scale(1.08)" : "scale(1)",
          }}
        >
          {listening
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="white"/></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" fill="white"/><path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          }
        </button>
        <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>{listening ? "Listening…" : "Tap to speak"}</p>
      </div>

      {/* Text input */}
      <form onSubmit={handleSubmit} className="px-4 pb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Or type your question…"
          className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
          style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }}
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: "#16a34a" }}
        >
          Ask
        </button>
      </form>

      {/* Suggested prompts */}
      {!response && !loading && (
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: "#6b7280" }}>Try asking:</p>
          <div className="space-y-1.5">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => handlePrompt(p)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#16a34a"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: "#e5e7eb", borderTopColor: "#16a34a" }}/>
          <p className="text-xs" style={{ color: "#6b7280" }}>Bexxa is thinking…</p>
        </div>
      )}

      {/* Response */}
      {response && !loading && (
        <div className="px-4 pb-4 space-y-2">
          <div className="rounded-lg px-3 py-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "#166534" }}>{response}</p>
          </div>
          {stations.map(s => <StationResult key={s.id} station={s} />)}
          <button
            onClick={() => { setResponse(null); setStations([]); setInputVal(""); }}
            className="text-xs underline"
            style={{ color: "#9ca3af" }}
          >
            Ask another question
          </button>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BexxaAssistantPage() {
  const navigate    = useNavigate();
  const assistantRef = useRef(null);
  const inputRef     = useRef(null);

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    bexxaApi.getPageData()
      .then(d => setPageData(d))
      .catch(() => setPageData(null))
      .finally(() => setLoading(false));
  }, []);

  const scrollToAssistant = () => {
    assistantRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => inputRef.current?.focus(), 600);
  };

  const prompts      = pageData?.suggestedPrompts || ["Find the nearest Shell station", "Show stations with EV charging", "What's at junction 15A?", "Stations open 24/7 near me"];
  const features     = pageData?.features         || [];
  const steps        = pageData?.steps            || [];
  const faqs         = pageData?.faqs             || [];
  const isOnline     = pageData?.isOnline         ?? true;

  return (
    <div style={{ background: "#f8fffe" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#16a34a"/></svg>
              Voice Assistant
            </span>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight" style={{ color: "#111827" }}>
              Meet Bexxa
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: "#4b5563", maxWidth: 440 }}>
              {pageData?.heroSubtitle || "Your hands-free voice assistant for motorway service stations. Use simple voice commands to find stations, create reports, and navigate safely."}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={scrollToAssistant}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" fill="white"/><path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                Try Bexxa Now
              </button>
              <button
                onClick={() => navigate("/nearby")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#16a34a"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Explore Nearby Stations
              </button>
            </div>
          </div>

          {/* Right — assistant card */}
          <div ref={assistantRef} className="flex justify-center lg:justify-end">
            {loading
              ? <div className="w-80 h-64 rounded-2xl animate-pulse" style={{ background: "#e5e7eb" }}/>
              : <div className="w-full max-w-sm"><AssistantCard prompts={prompts} isOnline={isOnline} inputRef={inputRef} /></div>
            }
          </div>
        </div>
      </section>

      {/* ── WHY USE BEXXA ────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>Why Use Bexxa?</h2>
            <p className="text-sm" style={{ color: "#6b7280", maxWidth: 480, margin: "0 auto" }}>
              Bexxa makes finding motorway service stations faster, easier, and safer—especially when you're on the road.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl p-5" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <FeatureIcon iconKey={f.iconKey} />
                <h3 className="text-sm font-bold mt-3 mb-1" style={{ color: "#111827" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW BEXXA HELPS ──────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "#f9fafb" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>How Bexxa Helps</h2>
            <p className="text-sm" style={{ color: "#6b7280" }}>Getting started with Bexxa is simple. Here's how it works:</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.stepNumber} className="flex flex-col items-center text-center relative">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[calc(50%+28px)] right-[-50%] h-px" style={{ background: "#d1fae5" }}/>
                )}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3 relative z-10"
                  style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "2px solid #bbf7d0" }}
                >
                  {step.stepNumber}
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: "#111827" }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>Frequently Asked Questions</h2>
            <p className="text-sm" style={{ color: "#6b7280" }}>Everything you need to know about Bexxa.</p>
          </div>
          <div className="space-y-3">
            {faqs.map(f => <FAQItem key={f.question} question={f.question} answer={f.answer} />)}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ────────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-2">
            {pageData?.ctaTitle || "Ready to try Bexxa?"}
          </h2>
          <p className="text-sm text-green-100 mb-8">
            {pageData?.ctaText || "Start exploring motorway service stations with your hands-free voice assistant today."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={scrollToAssistant}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#fff", color: "#16a34a" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" fill="#16a34a"/><path d="M5 10a7 7 0 0 0 14 0" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg>
              Activate Bexxa
            </button>
            <button
              onClick={() => navigate("/nearby")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              Find Nearby Stations
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
