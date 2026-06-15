# syntax=docker/dockerfile:1

# ---- Build stage: install all deps and build client + server ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci

# Build both workspaces.
COPY . .
RUN npm run build

# ---- Runtime stage: production deps only + built artifacts ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# The server reads the active workbook from /app/data (mounted volume) and
# serves the prebuilt client from /app/client/dist.
ENV CLIENT_DIST_DIR=/app/client/dist
ENV GLOBAL_EVENTS_DATA_DIR=/app/data

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --omit=dev && npm cache clean --force

# Built output and the reference workbook used to seed the first run.
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY technical_events_normalized.xlsx ./technical_events_normalized.xlsx

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
