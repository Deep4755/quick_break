import React from "react";

// Shared QuickBreak brand logo — used in Navbar and Footer
// size: "md" (default, navbar) | "sm" (footer)
export default function QuickBreakLogo({ size = "md" }) {
  const iconSize  = size === "sm" ? 32 : 36;
  const pinSize   = size === "sm" ? 15 : 18;
  const radius    = size === "sm" ? "10px" : "12px";
  const textClass = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: radius,
          background: "#16a34a",
        }}
      >
        <svg width={pinSize} height={pinSize} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="white"
          />
          <circle cx="12" cy="9" r="2.5" fill="#16a34a" />
        </svg>
      </div>
      <span className={`${textClass} font-bold tracking-tight`}>
        <span style={{ color: "#16a34a" }}>Quick</span>
        <span style={{ color: "#111827" }}>Break</span>
      </span>
    </div>
  );
}
