"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

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

// Public pages that don't require authentication
const PUBLIC_PAGES = ["/login", "/", "/404"];

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Keep the ref in sync with the latest pathname
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/me", {
        credentials: "include",
      });

      if (!response.ok) {
        // On public pages, 401 is expected and not an error
        const isPublicPage = PUBLIC_PAGES.includes(pathnameRef.current);

        if (response.status === 401) {
          if (!isPublicPage) {
            console.warn("Session fetch failed:", response.status);
            setError("Session expired");
          }
          setUser(null);
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
  }, []); // Stable callback that uses pathnameRef for latest value

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
