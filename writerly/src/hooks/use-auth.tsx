import React, { createContext, useContext, useEffect, useState } from "react";

interface SimpleUser {
  id: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  initializing: boolean;
  user: SimpleUser | null;
  login: (token: string) => void;
  logout: () => void;
  authorizedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<SimpleUser | null>(null);

  // Load token on start
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token) {
      setIsAuthenticated(true);
      if (savedUser) setUser(JSON.parse(savedUser));
    }

    setInitializing(false);
  }, []);

  // Called on login
  const login = (token: string): void => {
    localStorage.setItem("token", token);

    // mock user (you can replace with API)
    const mockUser = { id: "1", email: "user@example.com" };
    localStorage.setItem("user", JSON.stringify(mockUser));

    setUser(mockUser);
    setIsAuthenticated(true);
  };

  // Called on logout
  const logout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  const authorizedFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem("token");

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
  };

  return (
      <AuthContext.Provider
          value={{
            isAuthenticated,
            initializing,
            user,
            login,
            logout,
            authorizedFetch,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
