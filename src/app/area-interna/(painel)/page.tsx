"use client";

import Dashboard from "@/components/Dashboard";
import { useDemoSession } from "@/lib/demoSession";

export default function DashboardPage() {
  const { currentUser } = useDemoSession();
  return currentUser && <Dashboard role={currentUser.role} />;
}
