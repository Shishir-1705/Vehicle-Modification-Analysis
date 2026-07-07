# --- STAGE 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
# Standard Next.js production build
RUN npm run build

# --- STAGE 2: Runner ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Only copy essential files for production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Start Next.js optimized runner
CMD ["npm", "start"]
