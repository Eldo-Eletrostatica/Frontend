"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sendApiRequest } from "@/lib/api/client";
import { CSRF_COOKIE, readCookie } from "@/lib/api/cookies";

export type Role = "admin" | "manager" | "employee";

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: Role;
}

interface LoginResponse {
  accessToken: string;
  employee: Employee;
}

interface AuthState {
  currentEmployee: Employee | null;
  hasLoaded: boolean;
}

interface AuthValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentEmployee: (employee: Employee) => void;
}

const AuthContext = createContext<AuthValue>({
  currentEmployee: null,
  hasLoaded: false,
  login: async () => {},
  logout: async () => {},
  updateCurrentEmployee: () => {},
});

function hasCsrfCookie(): boolean {
  const token = readCookie(CSRF_COOKIE);
  return Boolean(token && token.trim().length > 0);
}

// The provider wraps the public site too. Without the CSRF cookie there is no
// session, so visitors skip a GET /auth/me that would only answer 401.
async function fetchCurrentEmployee(): Promise<Employee | null> {
  if (!hasCsrfCookie()) return null;
  try {
    return await sendApiRequest<Employee>("/auth/me", { skipAuthRedirect: true });
  } catch {
    // An expired session (401) or an unreachable API both mean signed out.
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ currentEmployee: null, hasLoaded: false });

  useEffect(() => {
    let isMounted = true;
    fetchCurrentEmployee().then((currentEmployee) => {
      if (isMounted) setState({ currentEmployee, hasLoaded: true });
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
    setState({ currentEmployee: employee, hasLoaded: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await sendApiRequest<void>("/auth/logout", { method: "POST" });
    } finally {
      setState({ currentEmployee: null, hasLoaded: true });
    }
  }, []);

  // Keeps the sidebar and role guards in sync when an administrator edits
  // their own account in the Employees screen.
  const updateCurrentEmployee = useCallback((employee: Employee) => {
    setState((current) => {
      if (current.currentEmployee?.employeeId !== employee.employeeId) return current;
      return { ...current, currentEmployee: employee };
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      login,
      logout,
      updateCurrentEmployee,
    }),
    [state, login, logout, updateCurrentEmployee],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
