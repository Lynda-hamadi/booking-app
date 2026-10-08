"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = {
  id: number;
  email: string;
  name: string;
  role: "USER" | "OWNER";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch {
      localStorage.removeItem("auth");
    }
    setLoading(false);
  }, []);

  function login(newToken: string, newUser: User) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("auth", JSON.stringify({ token: newToken, user: newUser }));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
}