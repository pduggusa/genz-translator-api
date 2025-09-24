#!/bin/bash
# 🚀 Production ACR Build Script - AMD64 Optimized
# Builds and pushes optimized container to Azure Container Registry

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY_NAME="${REGISTRY_NAME:-genztranslatoracrcentralus}"
REGISTRY_LOGIN_SERVER="${REGISTRY_LOGIN_SERVER:-genztranslatoracrcentralus.azurecr.io}"
IMAGE_NAME="${IMAGE_NAME:-vibe-coding-academy}"
DOCKERFILE="${DOCKERFILE:-Dockerfile.optimized}"
PLATFORM="${PLATFORM:-linux/amd64}"

echo -e "${BLUE}🚀 Production ACR Build - AMD64 Optimized${NC}"
echo "Registry: $REGISTRY_LOGIN_SERVER"
echo "Image: $IMAGE_NAME"
echo "Platform: $PLATFORM"
echo "Dockerfile: $DOCKERFILE"
echo ""

# Check if logged into Azure
if ! az account show > /dev/null 2>&1; then
    echo -e "${RED}❌ Not logged into Azure. Please run 'az login' first.${NC}"
    exit 1
fi

# Login to ACR
echo -e "${YELLOW}🔑 Logging into ACR...${NC}"
az acr login --name $REGISTRY_NAME

# Build version tag from current commit
GIT_COMMIT=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create image tags
IMAGE_TAGS=(
    "$REGISTRY_LOGIN_SERVER/$IMAGE_NAME:latest"
    "$REGISTRY_LOGIN_SERVER/$IMAGE_NAME:production"
    "$REGISTRY_LOGIN_SERVER/$IMAGE_NAME:$GIT_BRANCH-$GIT_COMMIT"
    "$REGISTRY_LOGIN_SERVER/$IMAGE_NAME:$TIMESTAMP"
)

# Build tag arguments for Docker
TAG_ARGS=""
for tag in "${IMAGE_TAGS[@]}"; do
    TAG_ARGS="$TAG_ARGS -t $tag"
done

echo -e "${YELLOW}📦 Building for production platform: $PLATFORM${NC}"
echo "Tags:"
for tag in "${IMAGE_TAGS[@]}"; do
    echo "  - $tag"
done
echo ""

# Build with Docker Buildx for AMD64
echo -e "${YELLOW}🔨 Building with Docker Buildx (optimized for Azure)...${NC}"

# Ensure buildx is available
docker buildx create --use --name acr-builder || docker buildx use acr-builder

# Build and push to ACR
docker buildx build \
    --platform $PLATFORM \
    --file $DOCKERFILE \
    $TAG_ARGS \
    --push \
    --cache-from type=registry,ref=$REGISTRY_LOGIN_SERVER/$IMAGE_NAME:cache \
    --cache-to type=registry,ref=$REGISTRY_LOGIN_SERVER/$IMAGE_NAME:cache,mode=max \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --progress=plain \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build and push completed successfully${NC}"

    # Verify images in ACR
    echo -e "${BLUE}📊 Images in ACR:${NC}"
    az acr repository show-tags \
        --name $REGISTRY_NAME \
        --repository $IMAGE_NAME \
        --output table

    # Show image details
    echo -e "${BLUE}🔍 Latest Image Details:${NC}"
    docker buildx imagetools inspect $REGISTRY_LOGIN_SERVER/$IMAGE_NAME:production

    echo -e "${GREEN}🎉 Production image ready for deployment!${NC}"
    echo -e "${BLUE}Image: $REGISTRY_LOGIN_SERVER/$IMAGE_NAME:production${NC}"
    echo -e "${BLUE}Platform: $PLATFORM (Azure Container Apps optimized)${NC}"

else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Cleanup buildx builder
docker buildx rm acr-builder || true