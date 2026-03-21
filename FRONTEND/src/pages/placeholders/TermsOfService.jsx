import React from "react";

export default function TermsOfService() {
  return (
    <div style={{ background: "#f0f4f0", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>Terms of Service</h1>
        <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Last updated: 2026</p>

        {[
          { heading: "Acceptance of Terms", body: "By using QuickBreak, you agree to these terms. If you do not agree, please do not use the service." },
          { heading: "Use of Service", body: "QuickBreak is provided for personal, non-commercial use. You may not misuse the service or attempt to access it in unauthorised ways." },
          { heading: "User Accounts", body: "You are responsible for maintaining the security of your account credentials. QuickBreak is not liable for any loss resulting from unauthorised account access." },
          { heading: "User Content", body: "Reports and reviews you submit must be accurate and respectful. QuickBreak reserves the right to remove content that violates community standards." },
          { heading: "Limitation of Liability", body: "QuickBreak is provided as-is. We do not guarantee the accuracy of station data and are not liable for decisions made based on information in the app." },
          { heading: "Changes to Terms", body: "We may update these terms from time to time. Continued use of QuickBreak after changes constitutes acceptance of the new terms." },
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
