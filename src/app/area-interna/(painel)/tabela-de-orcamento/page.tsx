"use client";

import QuoteTable from "@/components/QuoteTable";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function QuoteTablePage() {
  const { currentEmployee } = useAuth();
  return currentEmployee && <QuoteTable />;
}
