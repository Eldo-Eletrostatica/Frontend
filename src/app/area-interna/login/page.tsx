"use client";

import { useRouter } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import { useDemoSession } from "@/lib/demoSession";
import { ROUTES } from "@/lib/routes";

export default function InternalLoginPage() {
  const router = useRouter();
  const { signIn } = useDemoSession();

  return (
    <LoginPage
      onLogin={(email) => {
        signIn(email);
        router.push(ROUTES.internalArea);
      }}
      onBack={() => router.push(ROUTES.home)}
    />
  );
}
