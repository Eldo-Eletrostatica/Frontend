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
# next build writes the /api rewrite and the allowed image host into the
# build output, so both URLs must be known here, not only when the container
# runs: docker build --build-arg API_URL=... --build-arg STORAGE_PUBLIC_URL=...
ARG API_URL
ARG STORAGE_PUBLIC_URL
ENV API_URL=$API_URL
ENV STORAGE_PUBLIC_URL=$STORAGE_PUBLIC_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod: imagem enxuta, roda o build standalone do Next.js ----
FROM base AS prod
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
