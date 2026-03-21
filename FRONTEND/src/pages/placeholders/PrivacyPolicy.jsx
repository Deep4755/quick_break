import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{ background: "#f0f4f0", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>Privacy Policy</h1>
        <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Last updated: 2026</p>

        {[
          { heading: "Information We Collect", body: "We collect information you provide when registering, such as your name and email address. We also collect usage data to improve the QuickBreak experience." },
          { heading: "How We Use Your Data", body: "Your data is used to provide the QuickBreak service, including saving your favourite stations, generating reports, and personalising your experience." },
          { heading: "Data Storage", body: "Your data is stored securely in our database. We do not sell your personal information to third parties." },
          { heading: "Cookies", body: "QuickBreak uses local storage to maintain your session. No third-party tracking cookies are used." },
          { heading: "Your Rights", body: "You may request deletion of your account and associated data at any time by contacting us." },
          { heading: "Contact", body: "For privacy-related queries, please use the Contact page." },
        ].map(({ heading, body }) => (
          <div key={heading} className="mb-6">
            <h2 className="text-base font-semibold mb-1" style={{ color: "#111827" }}>{heading}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
