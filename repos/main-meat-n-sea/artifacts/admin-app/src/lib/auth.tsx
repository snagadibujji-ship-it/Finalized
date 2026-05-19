import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useGetMe, getGetMeQueryKey, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("localmart_token");
    }
    return null;
  });

  const { data: user, isLoading: isQueryLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  // If there's an error fetching the user (e.g. invalid token), clear it
  useEffect(() => {
    if (isError) {
      setToken(null);
      localStorage.removeItem("localmart_token");
    }
  }, [isError]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("localmart_token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("localmart_token");
    setToken(null);
  }, []);

  const isLoading = !!token && isQueryLoading;

  return (
    <AuthContext.Provider value={{ user: user || null, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
