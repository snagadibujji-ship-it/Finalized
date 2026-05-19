import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useGetMe, getGetMeQueryKey, User, AuthResponse } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("localmart_token")
  );

  const { data: user, isLoading: isQueryLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (isError) {
      setToken(null);
      localStorage.removeItem("localmart_token");
    }
  }, [isError]);

  const login = useCallback((data: AuthResponse) => {
    localStorage.setItem("localmart_token", data.token);
    setToken(data.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("localmart_token");
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user: user ?? null,
        isLoading: !!token && isQueryLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
