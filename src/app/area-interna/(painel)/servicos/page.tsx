import LowStockNotice from "@/components/LowStockNotice";
import Services from "@/components/Services";

// The employee lands here (the Dashboard is for managers and administrators),
// so the stock warning of US15 shows on this screen too.
export default function ServiceOrdersPage() {
  return (
    <>
      <LowStockNotice />
      <Services />
    </>
  );
}
