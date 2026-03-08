import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // optional: if your AuthContext checks localStorage on load
  if (loading) return null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
