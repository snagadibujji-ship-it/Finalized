import React, { createContext, useContext, useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, User } from "@workspace/api-client-react";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("localmart_token"));
  
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false
    }
  });

  useEffect(() => {
    if (error) {
      localStorage.removeItem("localmart_token");
      setToken(null);
    }
  }, [error]);

  const login = (newToken: string, user: User) => {
    localStorage.setItem("localmart_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("localmart_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
