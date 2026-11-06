import type { NextConfig } from "next";

// The browser only talks to this site: /api/* is forwarded to the Backend, so
// the session cookie stays first-party (ADR 0007). API_URL is server-only.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

// Images uploaded to the bucket (SeaweedFS in development, Cloudflare R2 in
// production) are served from this public URL (ADR 0006).
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL ?? "http://localhost:8333/eldo";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
  images: {
    remotePatterns: [new URL(`${STORAGE_PUBLIC_URL}/**`)],
  },
};

export default nextConfig;
