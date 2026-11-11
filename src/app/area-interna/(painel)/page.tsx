"use client";

import Dashboard from "@/components/Dashboard";
import LowStockNotice from "@/components/LowStockNotice";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function DashboardPage() {
  const { currentEmployee } = useAuth();
  if (!currentEmployee) return null;
  return (
    <>
      <LowStockNotice />
      <Dashboard role={currentEmployee.role} />
    </>
  );
}
