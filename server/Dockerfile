# ── Build stage ────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Runtime stage ───────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["node", "index.js"]
