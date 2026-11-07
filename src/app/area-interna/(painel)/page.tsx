"use client";

import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function DashboardPage() {
  const { currentEmployee } = useAuth();
  return currentEmployee && <Dashboard role={currentEmployee.role} />;
}
