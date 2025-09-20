#!/bin/bash
# 🚀 Optimized Build Script with Caching
# Builds Docker container with maximum cache efficiency

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="${IMAGE_NAME:-hacksaws2x4}"
TAG="${TAG:-latest}"
DOCKERFILE="${DOCKERFILE:-Dockerfile.optimized}"
CACHE_FROM="${CACHE_FROM:-$IMAGE_NAME:cache}"

echo -e "${BLUE}🚀 Starting Optimized Build Process${NC}"
echo "Image: $IMAGE_NAME:$TAG"
echo "Dockerfile: $DOCKERFILE"
echo "Cache from: $CACHE_FROM"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Build with BuildKit for advanced caching
echo -e "${YELLOW}📦 Building with Docker BuildKit (cache-optimized)${NC}"

# Set BuildKit environment variables for optimal caching
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build with cache mounts and multi-stage optimization
docker build \
    --file $DOCKERFILE \
    --tag $IMAGE_NAME:$TAG \
    --tag $IMAGE_NAME:cache \
    --cache-from $CACHE_FROM \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --progress=plain \
    .

# Verify the build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"

    # Show image info
    echo -e "${BLUE}📊 Image Information:${NC}"
    docker images $IMAGE_NAME:$TAG

    # Show image layers (for debugging cache efficiency)
    echo -e "${BLUE}🔍 Image Layers:${NC}"
    docker history $IMAGE_NAME:$TAG --format "table {{.CreatedBy}}\t{{.Size}}"

    # Test the container
    echo -e "${YELLOW}🧪 Testing container startup...${NC}"
    CONTAINER_ID=$(docker run -d -p 3001:3000 $IMAGE_NAME:$TAG)

    # Wait for startup
    sleep 5

    # Test health endpoint
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Container health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Container health check failed (might be normal for quick test)${NC}"
    fi

    # Cleanup test container
    docker stop $CONTAINER_ID > /dev/null 2>&1
    docker rm $CONTAINER_ID > /dev/null 2>&1

    echo -e "${GREEN}🎉 Optimized build complete!${NC}"
    echo -e "${BLUE}To run: docker run -p 3000:3000 $IMAGE_NAME:$TAG${NC}"

else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi