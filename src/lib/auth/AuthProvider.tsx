"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sendApiRequest } from "@/lib/api/client";

export type Role = "admin" | "manager" | "employee";

export interface AuthenticatedEmployee {
  employeeId: string;
  name: string;
  email: string;
  role: Role;
}

interface LoginResponse {
  accessToken: string;
  employee: AuthenticatedEmployee;
}

interface AuthState {
  currentUser: AuthenticatedEmployee | null;
  hasLoaded: boolean;
}

interface AuthValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// The Backend writes this readable cookie next to the HttpOnly session cookie,
// with the same lifetime (ADR 0007).
const CSRF_COOKIE = "csrf_token";

const AuthContext = createContext<AuthValue>({
  currentUser: null,
  hasLoaded: false,
  login: async () => {},
  logout: async () => {},
});

function hasCsrfCookie(): boolean {
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${CSRF_COOKIE}=`));
}

// The provider wraps the public site too. Without the CSRF cookie there is no
// session, so visitors skip a GET /auth/me that would only answer 401.
async function fetchCurrentUser(): Promise<AuthenticatedEmployee | null> {
  if (!hasCsrfCookie()) return null;
  try {
    return await sendApiRequest<AuthenticatedEmployee>("/auth/me");
  } catch {
    // An expired session (401) or an unreachable API both mean signed out.
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ currentUser: null, hasLoaded: false });

  useEffect(() => {
    let isMounted = true;
    fetchCurrentUser().then((currentUser) => {
      if (isMounted) setState({ currentUser, hasLoaded: true });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { employee } = await sendApiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setState({ currentUser: employee, hasLoaded: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await sendApiRequest<void>("/auth/logout", { method: "POST" });
    } finally {
      setState({ currentUser: null, hasLoaded: true });
    }
  }, []);

  const value = useMemo<AuthValue>(() => ({ ...state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
