"use client";

import Reports from "@/components/Reports";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function ReportsPage() {
  const { currentEmployee } = useAuth();
  return currentEmployee && <Reports role={currentEmployee.role} />;
}
