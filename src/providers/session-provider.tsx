"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "COACH" | "CLIENT";
  avatarUrl?: string;
  isPasswordChanged: boolean;
  isActive: boolean;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/me", {
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("Session fetch failed:", response.status);
        setUser(null);

        // Don't redirect here - let middleware handle it
        // The middleware will catch the invalid session and redirect
        if (response.status === 401) {
          setError("Session expired");
          return;
        }

        // For other errors, just set the error state
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch session");
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch (err) {
      console.error("Error fetching user session:", err);
      setError("Failed to fetch user session");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // Remove router dependency since we're using window.location.href

  const handleLogout = () => {
    setUser(null);
    setError(null);
    // Redirect to login
    window.location.href = "/login";
  };

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        error,
        refetch: fetchUser,
        logout: handleLogout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
