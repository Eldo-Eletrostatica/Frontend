"use client";

import Reports from "@/components/Reports";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function ReportsPage() {
  const { currentUser } = useAuth();
  return currentUser && <Reports role={currentUser.role} />;
}
