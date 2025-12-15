"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/me", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Session fetch failed:", response.status, errorData);
        setUser(null);
        if (response.status === 401) {
          // If no session is present, simply stay on the current page.
          return;
        }
        router.push("/login");
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
  }, [router]);

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
