import InternalLayout from "@/components/InternalLayout";

export default function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <InternalLayout>{children}</InternalLayout>;
}
