# Complete Google Cloud Deployment Guide

Deploy your entire HR 360 app stack to Google Cloud (no Vercel needed).

## Architecture Overview

```
Google Cloud Project
├── Cloud Run (Backend API)
│   └── Node.js/Express server on port 3000
├── Cloud Storage (Frontend Apps)
│   ├── Web Console (React PWA)
│   └── Mobile App (Expo PWA)
├── Cloud SQL (PostgreSQL Database)
└── Cloud CDN (Static file caching)
```

## Prerequisites

1. **Google Cloud Account** - https://cloud.google.com
2. **Google Cloud CLI** - https://cloud.google.com/sdk/docs/install
3. **Docker** (for local testing) - https://www.docker.com/products/docker-desktop

## Step 1: Set Up Google Cloud Project

### 1.1 Create a New Project
```bash
gcloud projects create hr-360-app --name="HR 360 Emergency App"
gcloud config set project hr-360-app
```

### 1.2 Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  storage-api.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### 1.3 Set Up Billing
- Go to https://console.cloud.google.com/billing
- Link a billing account to your project
- Set up budget alerts (optional but recommended)

## Step 2: Deploy Backend to Cloud Run

### 2.1 Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build 2>/dev/null || true

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
```

### 2.2 Build and Push to Container Registry

```bash
# Build Docker image
docker build -t gcr.io/hr-360-app/backend:latest backend/

# Push to Google Container Registry
docker push gcr.io/hr-360-app/backend:latest
```

### 2.3 Deploy to Cloud Run

```bash
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://user:pass@cloudsql-proxy:5432/hr360"
```

**Note**: You'll get a Cloud Run URL like `https://hr-360-backend-xxxxx.run.app`

## Step 3: Set Up Cloud SQL Database

### 3.1 Create PostgreSQL Instance

```bash
gcloud sql instances create hr-360-db \
  --database-version POSTGRES_15 \
  --tier db-f1-micro \
  --region us-central1 \
  --availability-type REGIONAL
```

### 3.2 Create Database and User

```bash
# Create database
gcloud sql databases create hr360 \
  --instance hr-360-db

# Create user
gcloud sql users create hr360user \
  --instance hr-360-db \
  --password
```

### 3.3 Get Connection String

```bash
gcloud sql instances describe hr-360-db --format='value(connectionName)'
```

Output will be: `project-id:region:instance-name`

## Step 4: Deploy Frontend Apps to Cloud Storage + Cloud CDN

### 4.1 Create Storage Buckets

```bash
# Web console bucket
gsutil mb -l us-central1 gs://hr-360-web-app

# Mobile app bucket
gsutil mb -l us-central1 gs://hr-360-mobile-app
```

### 4.2 Build Frontend Apps

```bash
# Build web app
cd web
npm run build
cd ..

# Build mobile app
cd mobile
npm run build
cd ..
```

### 4.3 Upload to Cloud Storage

```bash
# Upload web app
gsutil -m cp -r web/dist/* gs://hr-360-web-app/

# Upload mobile app
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

### 4.4 Configure for Web Hosting

```bash
# Web app
gsutil web set -m index.html -e index.html gs://hr-360-web-app

# Mobile app
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app
```

### 4.5 Set Public Access

```bash
# Make web app public
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app

# Make mobile app public
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app
```

### 4.6 Enable Cloud CDN

```bash
# Create backend buckets with CDN
gcloud compute backend-buckets create hr-360-web-backend \
  --gcs-uri-prefix=gs://hr-360-web-app \
  --enable-cdn

gcloud compute backend-buckets create hr-360-mobile-backend \
  --gcs-uri-prefix=gs://hr-360-mobile-app \
  --enable-cdn
```

## Step 5: Set Up Custom Domains (Optional)

### 5.1 Create Load Balancer

```bash
# Create URL map
gcloud compute url-maps create hr-360-lb \
  --default-backend-bucket hr-360-web-backend

# Add mobile app routing
gcloud compute url-maps add-path-rule hr-360-lb \
  --service=hr-360-mobile-backend \
  --path-matcher=mobile-paths \
  --new-hosts=mobile.hr360.com

# Create HTTPS proxy
gcloud compute target-https-proxies create hr-360-https-proxy \
  --url-map=hr-360-lb \
  --ssl-certificates=hr-360-cert

# Create forwarding rule
gcloud compute forwarding-rules create hr-360-https \
  --global \
  --target-https-proxy=hr-360-https-proxy \
  --address=hr-360-ip \
  --ports=443
```

## Step 6: Update Environment Variables

### 6.1 Update Frontend Apps

Update the API URL in your frontend apps to point to Cloud Run backend:

**Web app** (`web/.env`):
```
VITE_API_URL=https://hr-360-backend-xxxxx.run.app/api
VITE_ENV=production
```

**Mobile app** (`mobile/.env`):
```
EXPO_PUBLIC_API_URL=https://hr-360-backend-xxxxx.run.app/api
EXPO_PUBLIC_ENV=production
```

### 6.2 Rebuild and Redeploy

```bash
# Rebuild web app
cd web && npm run build && cd ..
gsutil -m cp -r web/dist/* gs://hr-360-web-app/

# Rebuild mobile app
cd mobile && npm run build && cd ..
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

## Step 7: Connect Backend to Database

### 7.1 Update Backend Connection

Update `backend/src/config/database.ts` to use Cloud SQL connection:

```typescript
const connectionString = process.env.DATABASE_URL || 
  'postgresql://hr360user:password@cloudsql-proxy:5432/hr360';

export const dataSource = new DataSource({
  type: 'postgres',
  url: connectionString,
  entities: [/* your entities */],
  synchronize: false,
  logging: false,
});
```

### 7.2 Deploy Backend with Database Connection

```bash
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://hr360user:password@cloudsql-proxy:5432/hr360" \
  --add-cloudsql-instances project-id:region:hr-360-db
```

## Step 8: Access Your Apps

### URLs

- **Web Console**: `https://storage.googleapis.com/hr-360-web-app/index.html`
- **Mobile App**: `https://storage.googleapis.com/hr-360-mobile-app/index.html`
- **Backend API**: `https://hr-360-backend-xxxxx.run.app/api`

Or with custom domains:
- **Web Console**: `https://web.hr360.com`
- **Mobile App**: `https://mobile.hr360.com`
- **Backend API**: `https://api.hr360.com`

## Monitoring & Logs

### View Backend Logs
```bash
gcloud run logs read hr-360-backend --limit 50
```

### View Database Logs
```bash
gcloud sql operations list --instance hr-360-db
```

### Set Up Monitoring
```bash
gcloud monitoring dashboards create --config-from-file=monitoring-config.yaml
```

## Cost Estimation

- **Cloud Run**: ~$0.40/month (free tier: 2M requests/month)
- **Cloud SQL**: ~$10-15/month (db-f1-micro)
- **Cloud Storage**: ~$0.02/GB/month
- **Cloud CDN**: ~$0.12/GB (first 1TB)

**Total**: ~$15-30/month for production

## Troubleshooting

### Backend not connecting to database
```bash
# Check Cloud SQL proxy
gcloud sql connect hr-360-db --user=hr360user

# Verify connection string
echo $DATABASE_URL
```

### Frontend apps not loading
```bash
# Check bucket contents
gsutil ls gs://hr-360-web-app/

# Check bucket permissions
gsutil iam get gs://hr-360-web-app/
```

### High latency
- Enable Cloud CDN caching
- Use regional endpoints closer to users
- Optimize image sizes in frontend apps

## Next Steps

1. Set up CI/CD pipeline to auto-deploy on GitHub push
2. Configure custom domain with SSL certificate
3. Set up monitoring and alerting
4. Configure backup strategy for Cloud SQL
5. Set up disaster recovery plan
