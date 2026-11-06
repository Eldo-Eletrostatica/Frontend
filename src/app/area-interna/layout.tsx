import type { Metadata } from "next";

// Kept out of search engines; robots.ts also disallows the path.
export const metadata: Metadata = {
  title: "Área interna | Eldo Pintura Eletrostática",
  robots: { index: false, follow: false },
};

export default function InternalAreaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
