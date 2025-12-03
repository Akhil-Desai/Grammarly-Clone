import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const BACKEND_URL =
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_BACKEND_URL) ||
  "https://grammarly-clone.onrender.com";

type User = {
  id: string;
  email: string;
  roles?: string[];
  tier?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authorizedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const saveToken = useCallback((t: string | null) => {
    if (t) {
      localStorage.setItem("auth_token", t);
    } else {
      localStorage.removeItem("auth_token");
    }
    setToken(t);
  }, []);

  const fetchMe = useCallback(async (t: string) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error("Unauthorized");
    const data = await res.json();
    setUser(data.user);
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        await fetchMe(token);
      } catch {
        saveToken(null);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, [token, fetchMe, saveToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const message = data?.error || text || "Login failed";
      throw new Error(message);
    }
    saveToken(data?.token);
    setUser(data?.user);
  }, [saveToken]);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const message = data?.error || text || "Signup failed";
      throw new Error(message);
    }
    saveToken(data?.token);
    setUser(data?.user);
  }, [saveToken]);

  const logout = useCallback(() => {
    saveToken(null);
    setUser(null);
  }, [saveToken]);

  const authorizedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers: Record<string, string> = { ...(init?.headers as any) };
      if (token) headers.Authorization = `Bearer ${token}`;
      // Prepend backend URL if input is a relative path
      let url = input;
      if (typeof input === "string" && input.startsWith("/")) {
        url = `${BACKEND_URL}${input}`;
      }
      const res = await fetch(url, { ...init, headers });
      if (res.status === 401) {
        // token invalid -> logout
        logout();
      }
      return res;
    },
    [token, logout]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      initializing,
      login,
      signup,
      logout,
      authorizedFetch,
    }),
    [user, token, initializing, login, signup, logout, authorizedFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
