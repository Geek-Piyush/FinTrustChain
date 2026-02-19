import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, users as usersApi } from "../api/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to load user on mount if token exists
  useEffect(() => {
    let mounted = true;
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await usersApi.me();
        const data = res?.data?.data || res?.data;
        // backend sometimes nests user under data.user
        const u = data?.user || data?.user || data;
        if (mounted) setUser(u?.user || u);
      } catch (err) {
        // token may be invalid; clear it
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const login = async credentials => {
    setLoading(true);
    try {
      const res = await auth.login(credentials);
      const token =
        res?.data?.token || res?.data?.data?.token || res?.data?.token;
      if (!token) throw new Error("No token returned from server");
      localStorage.setItem("token", token);
      // fetch user
      const me = await usersApi.me();
      const data = me?.data?.data || me?.data;
      const u = data?.user || data;
      setUser(u?.user || u);
      toast.success("Logged in");
      return { ok: true };
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Login failed"
      );
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const register = async formData => {
    setLoading(true);
    try {
      const res = await auth.register(formData);
      const token = res?.data?.token;
      if (!token) throw new Error("No token returned from server");
      localStorage.setItem("token", token);
      const me = await usersApi.me();
      const data = me?.data?.data || me?.data;
      const u = data?.user || data;
      setUser(u?.user || u);
      toast.success("Account created");
      return { ok: true };
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Registration failed"
      );
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const me = await usersApi.me();
      const data = me?.data?.data || me?.data;
      const u = data?.user || data;
      const resolved = u?.user || u;
      setUser(resolved);
      return { ok: true, user: resolved };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const logout = () => {
    // Clear all localStorage to remove any cached data
    localStorage.removeItem("token");
    localStorage.clear();
    setUser(null);
    // Force reload to clear all component state
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
