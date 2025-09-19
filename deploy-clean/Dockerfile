# 🛡️ Security-Validated Cannabis Extractor API
# Multi-stage build with security validation

# ============================================
# Stage 1: Security Validation & Build
# ============================================
FROM node:20-alpine AS security-validator

# Set working directory
WORKDIR /app

# Install security tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    bash \
    curl \
    jq \
    && pip3 install checkov

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for validation)
RUN npm ci

# Copy application code
COPY . .

# Copy security validation script
COPY ../scripts/deploy-security-check.sh ./scripts/
RUN chmod +x ./scripts/deploy-security-check.sh

# Run mandatory security validation
RUN echo "🛡️ Running mandatory security validation..." && \
    ./scripts/deploy-security-check.sh || \
    (echo "❌ SECURITY VALIDATION FAILED - BUILD BLOCKED" && exit 1)

# Run application tests
RUN npm run test

# ============================================
# Stage 2: Production Build
# ============================================
FROM node:20-alpine AS production-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Install Playwright Firefox for cannabis site extraction
RUN npx playwright install firefox --with-deps

# Copy validated application code from security stage
COPY --from=security-validator /app/server.js ./
COPY --from=security-validator /app/package.json ./

# ============================================
# Stage 3: Runtime Container
# ============================================
FROM node:20-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install runtime dependencies for Firefox
RUN apk add --no-cache \
    firefox \
    ttf-freefont \
    font-noto-emoji \
    chromium \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy production build
COPY --from=production-builder --chown=nodejs:nodejs /app ./

# Security: Set file permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Add security labels
LABEL security.scan.completed="true"
LABEL security.validation.required="true"
LABEL maintainer="security-validated-deployment"
LABEL version="2.0.0-secure"

# Start application
CMD ["node", "server.js"]