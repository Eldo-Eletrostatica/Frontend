"use client";

import Commissions from "@/components/Commissions";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function CommissionsPage() {
  const { currentEmployee } = useAuth();
  return currentEmployee && <Commissions />;
}
