# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# ---- deps: instala dependências a partir do lockfile ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: hot-reload, código montado via volume no docker-compose ----
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- builder: gera o build de produção ----
FROM base AS builder
ENV NODE_ENV=production
# next build writes the /api rewrite, the allowed image host and the
# NEXT_PUBLIC_ variables into the build output, so they must be known here,
# not only when the container runs: docker build --build-arg API_URL=...
# --build-arg STORAGE_PUBLIC_URL=... --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
ARG API_URL
ARG STORAGE_PUBLIC_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV API_URL=$API_URL
ENV STORAGE_PUBLIC_URL=$STORAGE_PUBLIC_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod: imagem enxuta, roda o build standalone do Next.js ----
FROM base AS prod
ENV NODE_ENV=production
# The Server Components and the revalidation route fetch the Backend
# directly by API_URL at runtime, so the value of the build is kept
# in the final image too. An ARG only exists in its own stage.
ARG API_URL
ENV API_URL=$API_URL
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
