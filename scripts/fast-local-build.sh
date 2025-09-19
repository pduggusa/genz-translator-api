#!/bin/bash
# 🚀 Fast Local Development Build
# Use this for rapid local testing before pushing to registry

set -e

echo "🏠 Fast local container build..."

# Check if optimized Dockerfile exists
if [ ! -f "Dockerfile.containerapp.optimized" ]; then
    echo "❌ Optimized Dockerfile not found. Creating symbolic link..."
    ln -sf Dockerfile.containerapp Dockerfile.containerapp.optimized
fi

# Build with maximum caching
docker build \
    -f Dockerfile.containerapp.optimized \
    -t cannabis-extractor:local-fast \
    --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --build-arg VCS_REF=$(git rev-parse --short HEAD) \
    --build-arg VERSION=$(git branch --show-current 2>/dev/null || echo "detached") \
    --build-arg SECURITY_VALIDATED=true \
    .

echo "✅ Fast local build completed!"
echo "🚀 Run with: docker run -p 3000:3000 cannabis-extractor:local-fast"
echo "🌐 Test at: http://localhost:3000"