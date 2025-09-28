# ---------- Base image tag ----------
# Use a small, secure base
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# Some native addons (e.g., sharp) need this on Alpine
RUN apk add --no-cache libc6-compat

# ---------- Deps stage (all deps for building) ----------
FROM base AS deps
# Copy only manifests first for better caching
COPY package*.json ./
# If you use npm:
RUN npm ci

# ---------- Builder stage (build Next) ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the source
COPY . .
ENV NODE_ENV=production
# If you use Prisma, you can generate here
# RUN npx prisma generate
RUN npm run build

# Prepare a deterministic /out directory so the runner COPY never fails,
# even if some folders (standalone/public) don't exist in the repo/build.
RUN set -eux; \
  mkdir -p /out/standalone /out/.next/static /out/public; \
  # Copy standalone server if it exists
  if [ -d "/app/.next/standalone" ]; then \
    cp -a /app/.next/standalone/. /out/; \
  fi; \
  # Always copy static assets if present
  if [ -d "/app/.next/static" ]; then \
    cp -a /app/.next/static/. /out/.next/static/; \
  fi; \
  # Copy public if your project has it
  if [ -d "/app/public" ]; then \
    cp -a /app/public/. /out/public/; \
  fi; \
  # Keep these for next start fallback
  cp -a /app/.next /out/.next || true; \
  cp -a /app/next.config.js /out/ 2>/dev/null || true; \
  cp -a /app/package*.json /out/

# ---------- Prod-deps stage (only production deps) ----------
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Runner stage (tiny runtime) ----------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=80
WORKDIR /app

# Security: create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy production node_modules and build artifacts
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /out ./

# Networking
EXPOSE 80

# Run as non-root
USER nextjs

# If Next produced standalone, there will be a server.js at project root.
# Otherwise, gracefully fall back to `next start`.
CMD [ "sh", "-lc", "if [ -f server.js ]; then node server.js; else npx next start -p ${PORT}; fi" ]