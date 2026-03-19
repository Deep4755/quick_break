import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * requireAuth=true  → only real logged-in users (not guests)
 * requireAuth=false → logged-in OR guest users allowed
 */
export default function ProtectRoute({ children, requireAuth = false }) {
  const { isLoggedIn, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Guest-restricted pages (e.g. create report)
  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Pages that need at least guest or logged-in
  if (!requireAuth && !isLoggedIn && !isGuest) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
