import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PUBLIC_PATHS = ["/guest-access", "/station-reviews", "/bexxa-assistant", "/help-center", "/contact", "/privacy-policy", "/terms-of-service"];

/**
 * requireAuth=true  → only real logged-in users (not guests)
 * requireAuth=false → logged-in OR guest users allowed; public paths always allowed
 */
export default function ProtectRoute({ children, requireAuth = false }) {
  const { isLoggedIn, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Always allow public info pages
  if (PUBLIC_PATHS.includes(location.pathname)) return children;

  // Guest-restricted pages (e.g. create report, saved stations)
  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Pages that need at least guest or logged-in
  if (!requireAuth && !isLoggedIn && !isGuest) {
    return <Navigate to="/guest-access" replace state={{ from: location.pathname }} />;
  }

  return children;
}
