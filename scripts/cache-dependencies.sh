#!/bin/bash
# 🚀 Cache Dependencies Script
# Pre-downloads and caches all dependencies for faster builds

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Caching Dependencies for Optimized Builds${NC}"

# Cache npm dependencies
echo -e "${YELLOW}📥 Caching npm dependencies...${NC}"
if [ -f package-lock.json ]; then
    npm ci --prefer-offline --no-audit --no-fund
    echo -e "${GREEN}✅ npm dependencies cached${NC}"
else
    echo -e "${YELLOW}⚠️  No package-lock.json found${NC}"
fi

# Cache Playwright browsers
echo -e "${YELLOW}🎭 Caching Playwright browsers...${NC}"
npx playwright install firefox --with-deps
echo -e "${GREEN}✅ Playwright Firefox cached${NC}"

# Cache security tools (local installation)
echo -e "${YELLOW}🛡️ Caching security tools...${NC}"

# Create local bin directory
mkdir -p ~/.local/bin

# Cache TruffleHog
if ! command -v trufflehog &> /dev/null; then
    echo "Installing TruffleHog..."
    curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | \
        sh -s -- -b ~/.local/bin v3.90.8
fi

# Cache Semgrep and Checkov
if ! command -v semgrep &> /dev/null; then
    echo "Installing Semgrep..."
    python3 -m pip install --user semgrep==1.137.0
fi

if ! command -v checkov &> /dev/null; then
    echo "Installing Checkov..."
    python3 -m pip install --user checkov==3.2.471
fi

echo -e "${GREEN}✅ Security tools cached${NC}"

# Cache Docker layers
echo -e "${YELLOW}🐳 Pre-warming Docker cache...${NC}"
if command -v docker &> /dev/null; then
    # Pull base images
    docker pull node:20-slim
    echo -e "${GREEN}✅ Docker base images cached${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not available, skipping Docker cache${NC}"
fi

# Show cache status
echo -e "${BLUE}📊 Cache Status:${NC}"
echo "Node modules: $(ls node_modules 2>/dev/null | wc -l) packages"
echo "Playwright: $(ls ~/.cache/ms-playwright 2>/dev/null | wc -l) browsers"
echo "Security tools: $(ls ~/.local/bin/{trufflehog,semgrep,checkov} 2>/dev/null | wc -l)/3 tools"

echo -e "${GREEN}🎉 All dependencies cached successfully!${NC}"
echo -e "${BLUE}Next builds will be significantly faster.${NC}"