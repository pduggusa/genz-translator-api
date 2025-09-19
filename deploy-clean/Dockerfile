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
# Stage 2: Production Build with Browser Preload
# ============================================
FROM node:20-alpine AS production-builder

WORKDIR /app

# Install Firefox and dependencies first
RUN apk add --no-cache \
    firefox \
    ttf-freefont \
    font-noto-emoji \
    dbus \
    xvfb \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Install and preload Playwright Firefox
RUN npx playwright install firefox --with-deps
RUN npx playwright install-deps firefox

# Verify Firefox installation and preload
RUN node -e "
const { firefox } = require('playwright');
(async () => {
  console.log('🔥 Preloading Firefox browser...');
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('data:text/html,<h1>Firefox Preloaded Successfully</h1>');
  await browser.close();
  console.log('✅ Firefox preloaded and verified');
})().catch(e => { console.error('❌ Firefox preload failed:', e); process.exit(1); });
"

# Copy validated application code from security stage
COPY --from=security-validator /app/server.js ./
COPY --from=security-validator /app/package.json ./

# ============================================
# Stage 3: Runtime Container with Preloaded Firefox
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
    dbus \
    xvfb \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy production build INCLUDING preloaded Firefox
COPY --from=production-builder --chown=nodejs:nodejs /app ./
COPY --from=production-builder --chown=nodejs:nodejs /root/.cache/ms-playwright /home/nodejs/.cache/ms-playwright

# Ensure Playwright cache directory exists and has correct permissions
RUN mkdir -p /home/nodejs/.cache/ms-playwright && \
    chown -R nodejs:nodejs /home/nodejs/.cache && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables for preloaded Firefox
ENV NODE_ENV=production
ENV PORT=3000
ENV PLAYWRIGHT_BROWSERS_PATH=/home/nodejs/.cache/ms-playwright
ENV DISPLAY=:99

# Verify Firefox is available at runtime
RUN node -e "
const fs = require('fs');
const path = require('path');
const browserPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
console.log('🔍 Checking Firefox installation...');
console.log('Browser path:', browserPath);
if (fs.existsSync(browserPath)) {
  console.log('✅ Firefox cache directory exists');
  console.log('Contents:', fs.readdirSync(browserPath));
} else {
  console.log('⚠️ Firefox cache directory not found');
}
"

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