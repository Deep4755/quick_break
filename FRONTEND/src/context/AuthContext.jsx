import { createContext, useContext, useEffect, useMemo, useState } from "react";
import authApi from "../api/authApi";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("qb_token") || "");
  const [loading, setLoading] = useState(false);

  // whenever token changes, attach to axios
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem("qb_token", token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem("qb_token");
    }
  }, [token]);

  // optional: restore user from localStorage too
  useEffect(() => {
    const savedUser = localStorage.getItem("qb_user");
    if (savedUser && !user) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
  }, [user]);

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      const { token: t, user: u } = res.data;

      setToken(t);
      setUser(u);
      localStorage.setItem("qb_user", JSON.stringify(u));
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
      localStorage.setItem("qb_user", JSON.stringify(u));
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("qb_user");
    localStorage.removeItem("qb_token");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isLoggedIn: !!token,
      register,
      login,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
