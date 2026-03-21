import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import contactApi from "../api/contactApi";
import { useAuth } from "../context/AuthContext";

// ── Contact info icons ────────────────────────────────────────────────────────
function InfoIcon({ iconKey }) {
  const icons = {
    email: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#16a34a" strokeWidth="2"/>
        <polyline points="22,6 12,13 2,6" stroke="#16a34a" strokeWidth="2"/>
      </svg>
    ),
    phone: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    clock: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2"/>
        <polyline points="12 6 12 12 16 14" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    location: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="10" r="3" stroke="#16a34a" strokeWidth="2"/>
      </svg>
    ),
  };
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: "#f0fdf4" }}>
      {icons[iconKey] || icons.email}
    </div>
  );
}

// ── Input component ───────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasError) => ({
  width: "100%",
  background: "#f9fafb",
  border: `1px solid ${hasError ? "#fca5a5" : "#e5e7eb"}`,
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#111827",
  fontSize: "14px",
  outline: "none",
});

const SUBJECTS = [
  "General Question",
  "Technical Support",
  "Account Help",
  "Saved Stations Issue",
  "Report Problem",
  "Review Issue",
  "Bexxa AI Assistant",
  "Feedback",
  "Other",
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const [pageData, setPageData] = useState(null);

  // form state
  const [form, setForm] = useState({ fullName: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  // prefill from logged-in user
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email:    prev.email    || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    contactApi.getPageData().then(setPageData).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())  e.fullName = "Full name is required";
    if (!form.email.trim())     e.email    = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Please enter a valid email";
    if (!form.subject)          e.subject  = "Please select a subject";
    if (!form.message.trim())   e.message  = "Message is required";
    else if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setSubmitting(true);
    setServerError("");
    try {
      await contactApi.sendMessage(form);
      setSubmitted(true);
      setForm({ fullName: user?.name || "", email: user?.email || "", subject: "", message: "" });
    } catch (err) {
      setServerError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const { hero, contactInfo = [], helpShortcut, cta } = pageData || {};

  return (
    <div className="min-h-screen" style={{ background: "#f9fafb" }}>

      {/* ── Hero ── */}
      <section className="py-12 px-4 text-center" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f9fafb 100%)" }}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
          style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#16a34a" strokeWidth="2.5"/>
            <polyline points="22,6 12,13 2,6" stroke="#16a34a" strokeWidth="2.5"/>
          </svg>
          {hero?.badge || "Get in Touch"}
        </span>
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: "#111827" }}>{hero?.title || "Contact"}</h1>
        <p className="text-base" style={{ color: "#6b7280" }}>{hero?.subtitle || "Get in touch with the QuickBreak team"}</p>
      </section>

      {/* ── Two-column section ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left column */}
          <div className="lg:w-72 flex-shrink-0 flex flex-col gap-4">

            {/* Contact info card */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Contact Information</h3>
              <div className="flex flex-col gap-4">
                {contactInfo.map(item => (
                  <div key={item.iconKey} className="flex items-start gap-3">
                    <InfoIcon iconKey={item.iconKey} />
                    <div>
                      <p className="text-xs" style={{ color: "#9ca3af" }}>{item.label}</p>
                      <p className="text-sm font-semibold" style={{ color: "#111827" }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help shortcut card */}
            <div className="rounded-2xl p-5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#111827" }}>
                {helpShortcut?.title || "Need quick help?"}
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "#4b5563" }}>
                {helpShortcut?.text || "Check our Help Center for instant answers to common questions."}
              </p>
              <button onClick={() => navigate("/help-center")}
                className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: "#16a34a" }}>
                {helpShortcut?.linkLabel || "Visit Help Center"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Right column — form */}
          <div className="flex-1 rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
            <h3 className="text-base font-bold mb-5" style={{ color: "#111827" }}>Send us a message</h3>

            {submitted ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#f0fdf4" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4 className="text-base font-bold mb-2" style={{ color: "#111827" }}>Message sent!</h4>
                <p className="text-sm mb-5" style={{ color: "#6b7280" }}>
                  Your message has been sent successfully. We'll get back to you within 24–48 hours.
                </p>
                <button onClick={() => setSubmitted(false)}
                  className="text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "#16a34a" }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" error={errors.fullName}>
                    <input
                      type="text" name="fullName" value={form.fullName}
                      onChange={handleChange} placeholder="John Doe"
                      style={inputStyle(!!errors.fullName)}
                    />
                  </Field>
                  <Field label="Email Address" error={errors.email}>
                    <input
                      type="email" name="email" value={form.email}
                      onChange={handleChange} placeholder="john@example.com"
                      style={inputStyle(!!errors.email)}
                    />
                  </Field>
                </div>

                <Field label="Subject" error={errors.subject}>
                  <div className="relative">
                    <select
                      name="subject" value={form.subject} onChange={handleChange}
                      style={{ ...inputStyle(!!errors.subject), appearance: "none", cursor: "pointer" }}
                    >
                      <option value="">Select a subject</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Field>

                <Field label="Message" error={errors.message}>
                  <textarea
                    name="message" value={form.message} onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    style={{ ...inputStyle(!!errors.message), resize: "none" }}
                  />
                  <p className="text-xs text-right mt-0.5" style={{ color: "#9ca3af" }}>
                    {form.message.length} chars
                  </p>
                </Field>

                {serverError && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
                    {serverError}
                  </p>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}>
                  {submitting ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <line x1="22" y1="2" x2="11" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
                  We typically respond within 24–48 hours during business days.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="rounded-2xl p-10 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#dcfce7" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="#16a34a" strokeWidth="2"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: "#111827" }}>
            {cta?.title || "Serving Drivers Across the UK"}
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "#4b5563" }}>
            {cta?.text || "QuickBreak is committed to helping drivers find the best motorway service stations throughout the United Kingdom. Your feedback helps us improve."}
          </p>
        </div>
      </div>
    </div>
  );
}
