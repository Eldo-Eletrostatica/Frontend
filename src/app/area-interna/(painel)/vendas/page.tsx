import { Suspense } from "react";
import Sales from "@/components/Sales";

// Sales reads the quote from the URL (useSearchParams), which needs Suspense.
export default function SalesPage() {
  return (
    <Suspense>
      <Sales />
    </Suspense>
  );
}
