#!/bin/bash

# Script to build and push Docker images for Scriptly Web and API
# Usage: ./build-docker.sh [VERSION] [NEXT_PUBLIC_API_URL]

VERSION=${1:-"v$(date +%Y%m%d_%H%M)"}
API_URL=${2:-"http://zephyr0109.duckdns.org:8100"}
HUB_ID="zephyr0109"

echo "----------------------------------------"
echo "🚀 Building Scriptly Images (Version: $VERSION)"
echo "----------------------------------------"

# 1. API Image
echo "📦 Building API..."
docker build -t $HUB_ID/scriptly-api:$VERSION ./scriptly-api
docker tag $HUB_ID/scriptly-api:$VERSION $HUB_ID/scriptly-api:latest

# 2. Web Image
echo "📦 Building Web (API_URL: $API_URL)..."
docker build -t $HUB_ID/scriptly-web:$VERSION \
  --build-arg NEXT_PUBLIC_API_URL=$API_URL \
  ./scriptly-web
docker tag $HUB_ID/scriptly-web:$VERSION $HUB_ID/scriptly-web:latest

echo ""
echo "----------------------------------------"
echo "⬆️ Pushing to Docker Hub..."
echo "----------------------------------------"

docker push $HUB_ID/scriptly-api:$VERSION
docker push $HUB_ID/scriptly-api:latest
docker push $HUB_ID/scriptly-web:$VERSION
docker push $HUB_ID/scriptly-web:latest

echo ""
echo "✅ Push complete! (Version: $VERSION)"
echo "You can now pull these images on your Oracle Cloud server."
