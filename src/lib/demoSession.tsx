"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Role = "admin" | "manager" | "employee";

export interface CurrentUser {
  name: string;
  role: Role;
}

// Prototype login: any email gets in and the role comes from the text typed.
// Kept in sessionStorage so a reload stays signed in; US09 replaces this with
// the session cookie and GET /auth/me (ADR 0007).
const STORAGE_KEY = "eldo-demo-user";
const CHANGE_EVENT = "eldo-demo-session-change";
// Snapshot used on the server and during hydration, before sessionStorage can
// be read.
const NOT_LOADED = "not-loaded";

interface DemoSessionValue {
  currentUser: CurrentUser | null;
  hasLoaded: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
}

const DemoSessionContext = createContext<DemoSessionValue>({
  currentUser: null,
  hasLoaded: false,
  signIn: () => {},
  signOut: () => {},
});

function userFromEmail(email: string): CurrentUser {
  const role: Role = email.includes("admin") ? "admin" : email.includes("gestor") ? "manager" : "employee";
  return { name: email.split("@")[0].replace(".", " "), role };
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function readStoredUser(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredUser(user: CurrentUser | null) {
  try {
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Without storage the session cannot be kept; the user signs in again.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const ROLES: readonly Role[] = ["admin", "manager", "employee"];

// The provider wraps the whole site, so a stored value it cannot read (edited
// by hand, or saved with an older role name) counts as signed out instead of
// breaking every page.
function parseStoredUser(storedUser: string): CurrentUser | null {
  try {
    const user = JSON.parse(storedUser) as Partial<CurrentUser>;
    return typeof user.name === "string" && ROLES.includes(user.role as Role)
      ? { name: user.name, role: user.role as Role }
      : null;
  } catch {
    return null;
  }
}

function signIn(email: string) {
  writeStoredUser(userFromEmail(email));
}

function signOut() {
  writeStoredUser(null);
}

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const storedUser = useSyncExternalStore(subscribe, readStoredUser, () => NOT_LOADED);
  const hasLoaded = storedUser !== NOT_LOADED;

  const value = useMemo<DemoSessionValue>(
    () => ({
      currentUser: hasLoaded && storedUser ? parseStoredUser(storedUser) : null,
      hasLoaded,
      signIn,
      signOut,
    }),
    [hasLoaded, storedUser],
  );

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  return useContext(DemoSessionContext);
}
