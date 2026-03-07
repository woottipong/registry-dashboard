# syntax=docker/dockerfile:1

# Stage 1: Install dependencies
FROM oven/bun:1.3.9-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Stage 2: Build the application
FROM oven/bun:1.3.9-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders — satisfy Zod validation during static page collection.
# These values are scoped to this stage and do NOT appear in the runtime image.
ENV SESSION_SECRET="build-time-placeholder-secret-min-32-chars!"
ENV APP_PASSWORD="buildtime"

RUN --mount=type=cache,target=/app/.next/cache \
    bun run build

# Stage 3: Production runner (minimal node image — bun not needed at runtime)
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache wget

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

VOLUME ["/app/data"]

ARG GIT_SHA=local
LABEL org.opencontainers.image.title="Registry Dashboard" \
      org.opencontainers.image.description="Modern web dashboard for browsing and managing Docker container images" \
      org.opencontainers.image.source="https://github.com/org/registry-ui" \
      org.opencontainers.image.revision="${GIT_SHA}"

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
