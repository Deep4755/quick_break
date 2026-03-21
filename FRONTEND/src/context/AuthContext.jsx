import { createContext, useContext, useEffect, useMemo, useState } from "react";
import authApi from "../api/authApi";
import guestAccessApi from "../api/guestAccessApi";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem("qb_token") || "");
  const [isGuest, setIsGuest] = useState(localStorage.getItem("qb_guest") === "true");
  const [loading, setLoading] = useState(false);

  // Attach / remove token from axios on change
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem("qb_token", token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem("qb_token");
    }
  }, [token]);

  // Restore user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("qb_user");
    if (saved && !user) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      const { token: t, user: u } = res.data;
      setToken(t);
      setUser(u);
      setIsGuest(false);
      localStorage.setItem("qb_user", JSON.stringify(u));
      localStorage.removeItem("qb_guest");
      localStorage.removeItem("qb_guest_token");
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { token: t, user: u } = res.data;
      setToken(t);
      setUser(u);
      setIsGuest(false);
      localStorage.setItem("qb_user", JSON.stringify(u));
      localStorage.removeItem("qb_guest");
      localStorage.removeItem("qb_guest_token");
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async () => {
    try {
      const res = await guestAccessApi.startSession({ sourcePage: "guest-access" });
      localStorage.setItem("qb_guest_token", res.sessionToken);
    } catch {
      // session creation failed — still allow guest mode locally
    }
    setIsGuest(true);
    setUser(null);
    setToken("");
    localStorage.setItem("qb_guest", "true");
    localStorage.removeItem("qb_token");
    localStorage.removeItem("qb_user");
  };

  const logout = () => {
    // end guest session if one exists
    const guestToken = localStorage.getItem("qb_guest_token");
    if (guestToken) {
      guestAccessApi.endSession(guestToken).catch(() => {});
      localStorage.removeItem("qb_guest_token");
    }
    setUser(null);
    setToken("");
    setIsGuest(false);
    localStorage.removeItem("qb_user");
    localStorage.removeItem("qb_token");
    localStorage.removeItem("qb_guest");
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isGuest,
    isLoggedIn: !!token,
    isAuthenticated: !!token || isGuest, // can access browsing pages
    register,
    login,
    logout,
    continueAsGuest,
  }), [user, token, loading, isGuest]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
