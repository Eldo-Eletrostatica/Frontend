"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { countLowStockItems } from "@/lib/inventory/api";
import { ROUTES } from "@/lib/routes";

// US15: the panel warns how many items are at or below the minimum stock.
// Without items in alert, or if the count fails, nothing is shown: the panel
// works without this notice.
export default function LowStockNotice() {
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    countLowStockItems()
      .then(({ count }) => {
        if (isCurrent) setLowStockCount(count);
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, []);

  if (lowStockCount === 0) return null;

  return (
    <Link
      href={ROUTES.inventory}
      className="flex items-center gap-3 px-5 py-3 mb-6 border border-site-accent/40 hover:bg-site-accent/6 transition-colors"
    >
      <AlertTriangle size={16} className="text-site-accent flex-shrink-0" />
      <p className="text-[13px] text-site-text/80" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
        <span className="text-site-accent font-bold">{lowStockCount}</span>{" "}
        {lowStockCount === 1 ? "item abaixo" : "itens abaixo"} do estoque mínimo.{" "}
        <span className="underline">Ver estoque</span>
      </p>
    </Link>
  );
}
