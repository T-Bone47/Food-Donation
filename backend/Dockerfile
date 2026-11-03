# ==============================================================================
# FoodShare Express API — Production Dockerfile
# Multi-stage, non-root, security-hardened Node.js image
# ==============================================================================

# STAGE 1: Dependency Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install production dependencies deterministically
COPY package*.json ./
RUN npm ci --omit=dev

# STAGE 2: Production Minimal Runtime
FROM node:20-slim AS runner

WORKDIR /app

# Ensure non-root node user ownership
USER node

# Copy production dependencies and application sources
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node . .

# Environment configuration
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Automated container healthcheck
HEALTHCHECK --interval=20s --timeout=4s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Graceful startup
CMD ["node", "index.js"]

