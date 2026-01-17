#!/bin/bash
# Deploy Resonance Worker to RunPod

set -e

echo "🚀 Deploying Resonance Worker to RunPod"
echo ""

# Check if Docker Hub username is provided
if [ -z "$1" ]; then
  echo "❌ Error: Docker Hub username required"
  echo "Usage: ./deploy-runpod.sh <dockerhub-username>"
  exit 1
fi

DOCKERHUB_USERNAME=$1
IMAGE_NAME="$DOCKERHUB_USERNAME/resonance-worker"
TAG="latest"

echo "📦 Building Docker image for linux/amd64..."
docker buildx build --platform linux/amd64 -t $IMAGE_NAME:$TAG .

echo ""
echo "🔐 Pushing to Docker Hub..."
docker push $IMAGE_NAME:$TAG

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://www.runpod.io/console/serverless"
echo "2. Create new endpoint with image: $IMAGE_NAME:$TAG"
echo "3. Select GPU: RTX 3090"
echo "4. Set environment variables (see RUNPOD_DEPLOYMENT.md)"
echo "5. Test with: curl -X POST https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run ..."
echo ""
echo "📖 Full docs: cat RUNPOD_DEPLOYMENT.md"
