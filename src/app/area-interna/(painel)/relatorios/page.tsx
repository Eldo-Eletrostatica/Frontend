"use client";

import Reports from "@/components/Reports";
import { useDemoSession } from "@/lib/demoSession";

export default function ReportsPage() {
  const { currentUser } = useDemoSession();
  return currentUser && <Reports role={currentUser.role} />;
}
