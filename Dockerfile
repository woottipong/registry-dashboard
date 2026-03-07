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
    bun run build \
    && mkdir -p /app/data

# Stage 3: Production runner — distroless for minimal size and attack surface
# nonroot variant runs as uid 65532 by default (no shell, no package manager)
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=65532:65532 /app/public ./public
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=builder --chown=65532:65532 /app/data ./data

VOLUME ["/app/data"]

ARG GIT_SHA=local
LABEL org.opencontainers.image.title="Registry Dashboard" \
      org.opencontainers.image.description="Modern web dashboard for browsing and managing Docker container images" \
      org.opencontainers.image.source="https://github.com/org/registry-ui" \
      org.opencontainers.image.revision="${GIT_SHA}"

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Exec form required — distroless has no shell
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:3000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]

# distroless/nodejs entrypoint is `node` — CMD provides the script argument
CMD ["server.js"]
