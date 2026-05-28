#!/bin/bash

# Google Cloud Deployment Script
# Deploys entire HR 360 app to Google Cloud

set -e

PROJECT_ID="hr-360-app"
REGION="us-central1"
BACKEND_IMAGE="gcr.io/$PROJECT_ID/backend"
WEB_BUCKET="gs://hr-360-web-app"
MOBILE_BUCKET="gs://hr-360-mobile-app"

echo "=========================================="
echo "HR 360 - Google Cloud Deployment"
echo "=========================================="

# Step 1: Set up project
echo ""
echo "Step 1: Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com storage-api.googleapis.com

# Step 2: Build and deploy backend
echo ""
echo "Step 2: Building and deploying backend..."
gcloud builds submit backend/ --tag $BACKEND_IMAGE
BACKEND_URL=$(gcloud run deploy hr-360-backend \
  --image $BACKEND_IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --format='value(status.url)' 2>/dev/null)

echo "Backend deployed to: $BACKEND_URL"

# Step 3: Build frontend apps
echo ""
echo "Step 3: Building frontend apps..."
cd web && npm run build && cd ..
cd mobile && npm run build && cd ..

# Step 4: Create storage buckets
echo ""
echo "Step 4: Creating storage buckets..."
gsutil mb -l $REGION $WEB_BUCKET 2>/dev/null || true
gsutil mb -l $REGION $MOBILE_BUCKET 2>/dev/null || true

# Step 5: Configure buckets for web hosting
echo ""
echo "Step 5: Configuring buckets for web hosting..."
gsutil web set -m index.html -e index.html $WEB_BUCKET
gsutil web set -m index.html -e index.html $MOBILE_BUCKET

# Step 6: Set public access
echo ""
echo "Step 6: Setting public access..."
gsutil iam ch allUsers:objectViewer $WEB_BUCKET
gsutil iam ch allUsers:objectViewer $MOBILE_BUCKET

# Step 7: Upload apps
echo ""
echo "Step 7: Uploading apps to Cloud Storage..."
gsutil -m cp -r web/dist/* $WEB_BUCKET/
gsutil -m cp -r mobile/dist/* $MOBILE_BUCKET/

# Step 8: Display URLs
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your apps are now live:"
echo ""
echo "Web Console:"
echo "  https://storage.googleapis.com/hr-360-web-app/index.html"
echo ""
echo "Mobile App:"
echo "  https://storage.googleapis.com/hr-360-mobile-app/index.html"
echo ""
echo "Backend API:"
echo "  $BACKEND_URL/api"
echo ""
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update frontend .env files with backend URL"
echo "2. Rebuild and redeploy frontend apps"
echo "3. Test device redirects"
echo "4. Set up custom domain (optional)"
echo ""
