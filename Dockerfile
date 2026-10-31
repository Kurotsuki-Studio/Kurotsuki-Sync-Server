# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3050
ENV HOST=0.0.0.0
ENV STORAGE_DIR=/data

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create storage directory
RUN mkdir -p /data

EXPOSE 3050

VOLUME ["/data"]

CMD ["node", "dist/index.js"]
