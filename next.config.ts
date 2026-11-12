import type { NextConfig } from "next";

import { resolveApiUrl } from "./src/lib/api/apiUrl";

// Both URLs are read when next build runs: the rewrite and the allowed image
// host are written into the build output, so a production build needs them
// set at build time (see the Dockerfile builder stage).

// The browser only talks to this site: /api/* is forwarded to the Backend, so
// the session cookie stays first-party (ADR 0007). API_URL is server-only.
const API_URL = resolveApiUrl();

// Images uploaded to the bucket (SeaweedFS in development, Cloudflare R2 in
// production) are served from this public URL (ADR 0006). A trailing slash
// would turn the pattern into "//**", which matches no image.
const STORAGE_PUBLIC_URL = (process.env.STORAGE_PUBLIC_URL ?? "http://localhost:8333/eldo").replace(/\/+$/, "");

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
