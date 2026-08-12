# --- deps + build stage ---
FROM node:22-slim AS builder
WORKDIR /app

# The Prisma engine binary needs OpenSSL available at build time to detect
# the right target and generate a matching client.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# --- production stage ---
FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Same reason as the builder stage: the compiled Prisma engine dynamically
# links against OpenSSL at runtime, not just at generate time.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
