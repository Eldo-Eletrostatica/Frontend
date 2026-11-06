import type { Metadata, Viewport } from "next";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eldo Pintura Eletrostática",
  description: "Pintura eletrostática a pó para estruturas metálicas, portões, máquinas e mobiliário industrial.",
};

export const viewport: Viewport = {
  themeColor: "#12100d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
