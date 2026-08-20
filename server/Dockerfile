# Multi-stage Dockerfile for StockPulse SQLite Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies for SQLite
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/app/data/stockpulse.db

COPY package.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/schema.sql ./dist/db/schema.sql
COPY --from=builder /app/src/db/schema.sql ./schema.sql
RUN mkdir -p ./src/db && cp ./schema.sql ./src/db/schema.sql

# Create volume mount point for persistent SQLite DB
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "dist/index.js"]
