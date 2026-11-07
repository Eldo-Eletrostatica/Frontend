"use client";

import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  return currentUser && <Dashboard role={currentUser.role} />;
}
