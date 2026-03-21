const ContactMessage = require("../models/ContactMessage");

const SUBJECT_OPTIONS = [
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── optional email helper ─────────────────────────────────────────────────────
async function trySendEmail(msg) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SUPPORT_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return; // no config — skip silently

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"QuickBreak Contact" <${SMTP_USER}>`,
      to:   SUPPORT_EMAIL || SMTP_USER,
      replyTo: msg.email,
      subject: `[QuickBreak Contact] ${msg.subject}`,
      text: `From: ${msg.fullName} <${msg.email}>\nSubject: ${msg.subject}\n\n${msg.message}`,
      html: `<p><strong>From:</strong> ${msg.fullName} &lt;${msg.email}&gt;</p>
             <p><strong>Subject:</strong> ${msg.subject}</p>
             <hr/>
             <p>${msg.message.replace(/\n/g, "<br/>")}</p>`,
    });
    console.log("[Contact] Email notification sent for message", msg._id);
  } catch (err) {
    console.warn("[Contact] Email send failed (DB save succeeded):", err.message);
  }
}

// ── GET /api/contact/page-data ────────────────────────────────────────────────
exports.getPageData = (req, res) => {
  res.json({
    hero: {
      badge:    "Get in Touch",
      title:    "Contact",
      subtitle: "Get in touch with the QuickBreak team",
    },
    contactInfo: [
      { iconKey: "email",    label: "Email",         value: "support@quickbreak.uk" },
      { iconKey: "phone",    label: "Phone",         value: "+44 20 1234 5678" },
      { iconKey: "clock",    label: "Response Time", value: "Within 24–48 hours" },
      { iconKey: "location", label: "Office",        value: "London, United Kingdom" },
    ],
    helpShortcut: {
      title: "Need quick help?",
      text:  "Check our Help Center for instant answers to common questions.",
      linkLabel: "Visit Help Center",
      linkTo: "/help-center",
    },
    subjectOptions: SUBJECT_OPTIONS,
    cta: {
      title: "Serving Drivers Across the UK",
      text:  "QuickBreak is committed to helping drivers find the best motorway service stations throughout the United Kingdom. Your feedback helps us improve.",
    },
  });
};

// ── POST /api/contact/messages ────────────────────────────────────────────────
exports.createMessage = async (req, res, next) => {
  try {
    const { fullName, email, subject, message } = req.body;

    // Validate
    if (!fullName?.trim())  { res.status(400); throw new Error("Full name is required"); }
    if (!email?.trim())     { res.status(400); throw new Error("Email address is required"); }
    if (!EMAIL_RE.test(email.trim())) { res.status(400); throw new Error("Please enter a valid email address"); }
    if (!subject?.trim())   { res.status(400); throw new Error("Subject is required"); }
    if (!SUBJECT_OPTIONS.includes(subject.trim())) { res.status(400); throw new Error("Invalid subject"); }
    if (!message?.trim())   { res.status(400); throw new Error("Message is required"); }
    if (message.trim().length < 10) { res.status(400); throw new Error("Message must be at least 10 characters"); }

    // Determine auth state
    let authState = "public";
    let userId    = null;
    let isGuest   = false;
    if (req.user) {
      authState = "authenticated";
      userId    = req.user._id;
    } else if (req.headers["x-guest-token"]) {
      authState = "guest";
      isGuest   = true;
    }

    const doc = await ContactMessage.create({
      fullName:   fullName.trim(),
      email:      email.trim().toLowerCase(),
      subject:    subject.trim(),
      message:    message.trim(),
      user:       userId,
      isGuest,
      metadata: {
        authState,
        userAgent: req.headers["user-agent"]?.slice(0, 200) || "",
      },
    });

    // Fire-and-forget email — never blocks the response
    trySendEmail(doc);

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you within 24–48 hours.",
      id: doc._id,
    });
  } catch (err) { next(err); }
};
