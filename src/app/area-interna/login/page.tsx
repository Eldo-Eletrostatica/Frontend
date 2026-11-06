"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/lib/auth/AuthProvider";
import { findPathAfterLogin } from "@/lib/auth/loginRedirect";
import { ROUTES } from "@/lib/routes";

const BLANK_SCREEN = <div className="min-h-screen" style={{ background: "#12100d" }} />;

function InternalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, hasLoaded, login } = useAuth();

  // Runs after a successful login and when someone already signed in opens
  // this page.
  useEffect(() => {
    if (currentUser) router.replace(findPathAfterLogin(searchParams));
  }, [currentUser, searchParams, router]);

  if (!hasLoaded || currentUser) return BLANK_SCREEN;

  return <LoginPage onLogin={login} onBack={() => router.push(ROUTES.home)} />;
}

// useSearchParams needs a Suspense boundary so the page can still be prerendered.
export default function InternalLoginPage() {
  return (
    <Suspense fallback={BLANK_SCREEN}>
      <InternalLogin />
    </Suspense>
  );
}
