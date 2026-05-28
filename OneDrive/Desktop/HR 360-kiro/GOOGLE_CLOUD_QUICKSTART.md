# Google Cloud Deployment - Quick Start (30 minutes)

Deploy your entire HR 360 app to Google Cloud in 30 minutes.

## Prerequisites

1. Google Cloud Account (free tier available)
2. Google Cloud CLI installed
3. Docker installed (for backend)

## Step 1: Create Google Cloud Project (2 min)

```bash
# Create project
gcloud projects create hr-360-app --name="HR 360"
gcloud config set project hr-360-app

# Enable APIs
gcloud services enable run.googleapis.com storage-api.googleapis.com
```

## Step 2: Deploy Backend to Cloud Run (10 min)

### 2.1 Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY tsconfig.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### 2.2 Build and Deploy

```bash
# Build and push to Container Registry
gcloud builds submit backend/ --tag gcr.io/hr-360-app/backend

# Deploy to Cloud Run
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi
```

**Save the URL** - you'll need it for frontend config.

## Step 3: Deploy Frontend Apps (10 min)

### 3.1 Build Apps

```bash
# Build web app
cd web && npm run build && cd ..

# Build mobile app
cd mobile && npm run build && cd ..
```

### 3.2 Create Storage Buckets

```bash
# Web app
gsutil mb gs://hr-360-web-app
gsutil web set -m index.html -e index.html gs://hr-360-web-app
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app

# Mobile app
gsutil mb gs://hr-360-mobile-app
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app
```

### 3.3 Upload Apps

```bash
# Upload web app
gsutil -m cp -r web/dist/* gs://hr-360-web-app/

# Upload mobile app
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

## Step 4: Update Frontend Config (5 min)

Update environment variables to point to your Cloud Run backend:

**web/.env**:
```
VITE_API_URL=https://hr-360-backend-xxxxx.run.app/api
VITE_ENV=production
```

**mobile/.env**:
```
EXPO_PUBLIC_API_URL=https://hr-360-backend-xxxxx.run.app/api
EXPO_PUBLIC_ENV=production
```

Rebuild and redeploy:

```bash
# Rebuild web
cd web && npm run build && gsutil -m cp -r dist/* gs://hr-360-web-app/ && cd ..

# Rebuild mobile
cd mobile && npm run build && gsutil -m cp -r dist/* gs://hr-360-mobile-app/ && cd ..
```

## Step 5: Access Your Apps (3 min)

### URLs

- **Web Console**: `https://storage.googleapis.com/hr-360-web-app/index.html`
- **Mobile App**: `https://storage.googleapis.com/hr-360-mobile-app/index.html`
- **Backend API**: `https://hr-360-backend-xxxxx.run.app/api`

### Test the Apps

1. Open web console URL in desktop browser
2. Open mobile app URL in mobile browser
3. Test device redirects (mobile → web redirect, desktop → mobile redirect)

## Optional: Set Up Custom Domain

```bash
# Create static IP
gcloud compute addresses create hr-360-ip --global

# Create load balancer with custom domain
# (See full guide for detailed steps)
```

## Monitoring

```bash
# View backend logs
gcloud run logs read hr-360-backend --limit 50

# View storage usage
gsutil du -s gs://hr-360-web-app gs://hr-360-mobile-app
```

## Cost

- **Cloud Run**: Free tier (2M requests/month)
- **Cloud Storage**: ~$0.02/GB/month
- **Total**: ~$1-5/month

## Troubleshooting

### Backend not responding
```bash
gcloud run logs read hr-360-backend --limit 20
```

### Frontend apps not loading
```bash
gsutil ls gs://hr-360-web-app/
gsutil iam get gs://hr-360-web-app/
```

### Device redirects not working
- Check browser console for errors
- Verify API URL is correct in .env files
- Clear browser cache

## Next Steps

1. Set up database (Cloud SQL) for persistent data
2. Configure CI/CD to auto-deploy on GitHub push
3. Set up custom domain with SSL
4. Configure monitoring and alerts
