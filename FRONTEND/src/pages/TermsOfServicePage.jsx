import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import legalApi from "../api/legalApi";

// ── Shared block renderers (same as PrivacyPolicyPage) ────────────────────────
function ParagraphBlock({ content }) {
  return <p className="text-sm leading-relaxed mb-3" style={{ color: "#374151" }}>{content}</p>;
}

function BulletsBlock({ items }) {
  return (
    <ul className="mb-3 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }}/>
          {item}
        </li>
      ))}
    </ul>
  );
}

function InfoCardsBlock({ cards }) {
  return (
    <div className="space-y-3 mb-3">
      {cards.map((card, i) => (
        <div key={i} className="rounded-lg px-4 py-3" style={{ borderLeft: "3px solid #16a34a", background: "#f9fafb" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#111827" }}>{card.title}</p>
          <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>{card.body}</p>
        </div>
      ))}
    </div>
  );
}

// ── Terms-specific block renderers ────────────────────────────────────────────

// Green box — Permitted Guest Activities
function GuestActivitiesBox({ title, items }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
      <p className="text-sm font-bold mb-2" style={{ color: "#16a34a" }}>{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#15803d" }}>
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }}/>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Yellow box — Important Notice
function NoticeBox({ title, text }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
      <p className="text-sm font-bold mb-1" style={{ color: "#92400e" }}>{title}</p>
      <p className="text-sm leading-relaxed" style={{ color: "#78350f" }}>{text}</p>
    </div>
  );
}

// Terms contact box with two emails + link to /contact
function TermsContactBox({ contactBox, navigate }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
      <p className="text-sm font-bold mb-2" style={{ color: "#111827" }}>{contactBox.teamName}</p>
      <p className="text-xs mb-0.5" style={{ color: "#4b5563" }}>
        Email:{" "}
        <a href={`mailto:${contactBox.email}`} style={{ color: "#16a34a" }}>{contactBox.email}</a>
      </p>
      {contactBox.supportEmail && (
        <p className="text-xs mb-0.5" style={{ color: "#4b5563" }}>
          Support Email:{" "}
          <a href={`mailto:${contactBox.supportEmail}`} style={{ color: "#16a34a" }}>{contactBox.supportEmail}</a>
        </p>
      )}
      <p className="text-xs mb-3" style={{ color: "#4b5563" }}>Response time: {contactBox.responseTime}</p>
      <button
        onClick={() => navigate("/contact?subject=Terms%20of%20Service%20Question")}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
        style={{ background: "#16a34a" }}>
        Contact Legal Team
      </button>
    </div>
  );
}

// Green acknowledgement box
function AcknowledgementBlock({ text }) {
  return (
    <div className="rounded-xl px-4 py-3 mt-2" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
      <p className="text-sm text-center" style={{ color: "#15803d" }}>{text}</p>
    </div>
  );
}

function renderBlock(block, idx, doc, navigate) {
  switch (block.type) {
    case "paragraph":         return <ParagraphBlock key={idx} content={block.content} />;
    case "bullets":           return <BulletsBlock key={idx} items={block.items} />;
    case "infoCards":         return <InfoCardsBlock key={idx} cards={block.cards} />;
    case "guestActivitiesBox":return <GuestActivitiesBox key={idx} title={block.title} items={block.items} />;
    case "noticeBox":         return <NoticeBox key={idx} title={block.title} text={block.text} />;
    case "termsContactBox":   return <TermsContactBox key={idx} contactBox={doc.contactBox} navigate={navigate} />;
    case "acknowledgement":   return doc.acknowledgementText
                                ? <AcknowledgementBlock key={idx} text={doc.acknowledgementText} />
                                : null;
    default:                  return null;
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function OnThisPageSidebar({ sections, activeKey }) {
  const scrollTo = (key) => {
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="rounded-xl p-4 sticky top-24" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
      <p className="text-xs font-bold tracking-widest mb-3" style={{ color: "#9ca3af" }}>ON THIS PAGE</p>
      <nav className="space-y-0.5">
        {sections.map(s => (
          <button key={s.key} onClick={() => scrollTo(s.key)}
            className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
            style={{
              color:      activeKey === s.key ? "#16a34a" : "#6b7280",
              background: activeKey === s.key ? "#f0fdf4" : "transparent",
              fontWeight: activeKey === s.key ? 600 : 400,
            }}>
            {s.title}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TermsOfServicePage() {
  const navigate = useNavigate();
  const [doc, setDoc]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState("");
  const sectionRefs = useRef({});

  useEffect(() => {
    legalApi.getDocument("terms-of-service")
      .then(setDoc)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Intersection observer — highlight active section while scrolling
  useEffect(() => {
    if (!doc?.sections?.length) return;
    const observers = [];
    doc.sections.forEach(s => {
      const el = document.getElementById(`section-${s.key}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveKey(s.key); },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [doc]);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "#e5e7eb", borderTopColor: "#16a34a" }}/>
    </div>
  );

  if (!doc) return (
    <div className="text-center py-32">
      <p className="text-sm" style={{ color: "#6b7280" }}>Could not load Terms of Service. Please try again later.</p>
    </div>
  );

  const lastUpdatedStr = doc.lastUpdated
    ? new Date(doc.lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen" style={{ background: "#f9fafb" }}>

      {/* ── Hero ── */}
      <section className="py-12 px-4 text-center" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f9fafb 100%)" }}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
          style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {doc.badgeLabel}
        </span>
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: "#111827" }}>{doc.title}</h1>
        <p className="text-base mb-3" style={{ color: "#6b7280" }}>{doc.subtitle}</p>
        {lastUpdatedStr && (
          <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: "#9ca3af" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#9ca3af" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="#9ca3af" strokeWidth="2"/>
            </svg>
            Last updated: {lastUpdatedStr}
          </p>
        )}
      </section>

      {/* ── Two-column layout ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0 w-full">
            <OnThisPageSidebar sections={doc.sections} activeKey={activeKey} />
          </div>

          {/* Content card */}
          <div className="flex-1 rounded-2xl p-8" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
            {doc.sections
              .slice()
              .sort((a, b) => a.order - b.order)
              .map(section => (
                <div
                  key={section.key}
                  id={`section-${section.key}`}
                  ref={el => { sectionRefs.current[section.key] = el; }}
                  className="mb-8 scroll-mt-28"
                >
                  <h2 className="text-lg font-extrabold mb-3" style={{ color: "#111827" }}>{section.title}</h2>
                  {(section.blocks || []).map((block, idx) =>
                    renderBlock(block, idx, doc, navigate)
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
