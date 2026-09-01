# ==========================================
# StockPulse Multi-Tenant Backend Container
# Google Cloud Run Optimized Production Image
# ==========================================

# ------------------------------------------
# Stage 1: Build NestJS Application
# ------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications for cached layer installation
COPY package.json package-lock.json ./
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# Build production distribution artifacts
RUN npm run build

# Prune devDependencies to keep final production image lean and minimal
RUN npm prune --production

# ------------------------------------------
# Stage 2: Minimal Production Runner
# ------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Configure production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Security & Compliance: Run as non-root user (GDPR / ISO 27001 / SOC 2 least privilege)
USER node

# Copy only compiled JS bundle and pruned production node_modules
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/dist ./dist

# Cloud Run default container listening port
EXPOSE 8080

# Health check configuration for container runtimes
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:${PORT:-8080}/health || exit 1

# Production entrypoint
CMD ["node", "dist/main.js"]
