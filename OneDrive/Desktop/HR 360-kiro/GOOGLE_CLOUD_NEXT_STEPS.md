# Google Cloud - Next Steps for HR 360 Deployment

You have Google Cloud projects ready. Here's what to do next.

---

## Your Current Setup

### Projects
- **HR 360** (Project ID: hr-360-497706) ✅ Selected
- **nth-sound-w07pf** (Another project)

### Organization
- **No organization** (You can create one later if needed)

---

## Step 1: Use the HR 360 Project

### Option A: Via CLI
```bash
# Set HR 360 as your default project
gcloud config set project hr-360-497706

# Verify it's set
gcloud config list
```

### Option B: Via Console
1. Go to https://console.cloud.google.com
2. Click project selector (top left)
3. Select "HR 360"
4. You're now in the HR 360 project

---

## Step 2: Enable Required APIs

### Via CLI (Recommended - Faster)
```bash
gcloud config set project hr-360-497706

gcloud services enable \
  run.googleapis.com \
  storage-api.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### Via Console
1. Go to https://console.cloud.google.com
2. Select "HR 360" project
3. Go to **APIs & Services** → **Library**
4. Search for and enable:
   - Cloud Run API
   - Cloud Storage API
   - Compute Engine API
   - Cloud Resource Manager API

---

## Step 3: Deploy Backend to Cloud Run

### Prerequisites
- Docker installed
- Backend code ready
- Docker image built

### Deploy via CLI
```bash
# Set project
gcloud config set project hr-360-497706

# Build Docker image
cd backend
docker build -t gcr.io/hr-360-497706/backend:latest .

# Push to Google Container Registry
docker push gcr.io/hr-360-497706/backend:latest

# Deploy to Cloud Run
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-497706/backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

### Expected Output
```
Service [hr-360-backend] revision [hr-360-backend-00001-xxx] has been deployed
Service URL: https://hr-360-backend-xxxxx.run.app
```

**Save this URL** - you'll need it for frontend configuration.

### Verify Deployment
```bash
# Test the backend
curl https://hr-360-backend-xxxxx.run.app/api/health

# View logs
gcloud run logs read hr-360-backend --limit 50
```

---

## Step 4: Create Cloud Storage Buckets

### Via CLI (Recommended)
```bash
# Set project
gcloud config set project hr-360-497706

# Create web app bucket
gsutil mb -l us-central1 gs://hr-360-web-app

# Create mobile app bucket
gsutil mb -l us-central1 gs://hr-360-mobile-app

# Configure for web hosting
gsutil web set -m index.html -e index.html gs://hr-360-web-app
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app

# Make public
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app
```

### Via Console
1. Go to **Cloud Storage** → **Buckets**
2. Click **Create Bucket**
3. Name: `hr-360-web-app`
4. Region: `us-central1`
5. Click **Create**
6. Repeat for `hr-360-mobile-app`
7. Configure each bucket for web hosting

---

## Step 5: Build Frontend Apps

### Build Web App
```bash
cd web
npm run build
cd ..
```

### Build Mobile App
```bash
cd mobile
npm run build
cd ..
```

### Verify Builds
```bash
ls -la web/dist/
ls -la mobile/dist/
```

Both should have `index.html` and `assets/` folder.

---

## Step 6: Upload Frontend Apps

### Via CLI (Recommended)
```bash
# Set project
gcloud config set project hr-360-497706

# Upload web app
gsutil -m cp -r web/dist/* gs://hr-360-web-app/

# Upload mobile app
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/

# Verify uploads
gsutil ls gs://hr-360-web-app/
gsutil ls gs://hr-360-mobile-app/
```

### Via Console
1. Go to **Cloud Storage** → **Buckets**
2. Click `hr-360-web-app`
3. Click **Upload files**
4. Select all files from `web/dist/`
5. Repeat for mobile app

---

## Step 7: Configure Environment Variables

### Update Web App
Edit `web/.env`:
```
VITE_API_URL=https://hr-360-backend-xxxxx.run.app/api
VITE_ENV=production
```

Replace `xxxxx` with your actual backend URL from Step 3.

### Update Mobile App
Edit `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://hr-360-backend-xxxxx.run.app/api
EXPO_PUBLIC_ENV=production
```

### Rebuild and Re-upload
```bash
# Rebuild web
cd web && npm run build && cd ..
gsutil -m cp -r web/dist/* gs://hr-360-web-app/

# Rebuild mobile
cd mobile && npm run build && cd ..
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

---

## Step 8: Verify Deployment

### Test Backend
```bash
curl https://hr-360-backend-xxxxx.run.app/api/health
```

Should return: `{"status":"ok"}`

### Test Web App
Open in browser:
```
https://storage.googleapis.com/hr-360-web-app/index.html
```

### Test Mobile App
Open in browser:
```
https://storage.googleapis.com/hr-360-mobile-app/index.html
```

### Test Device Redirects
- On mobile device: Visit web app URL → Should redirect to mobile app
- On desktop: Visit mobile app URL → Should redirect to web app

---

## Step 9: Monitor Your Deployment

### View Backend Logs
```bash
gcloud run logs read hr-360-backend --limit 50
gcloud run logs read hr-360-backend --follow  # Real-time
```

### View Storage Usage
```bash
gsutil du -s gs://hr-360-web-app gs://hr-360-mobile-app
```

### View Services
```bash
gcloud run services list
```

### Check Costs
1. Go to https://console.cloud.google.com
2. Go to **Billing**
3. View costs by service

---

## Step 10: Set Up Monitoring (Optional)

### Via Console
1. Go to **Monitoring** → **Dashboards**
2. Click **Create Dashboard**
3. Add charts for:
   - Cloud Run requests
   - Cloud Run errors
   - Storage usage
   - Data transfer

### Set Up Alerts
1. Go to **Monitoring** → **Alerting**
2. Click **Create Policy**
3. Set conditions (e.g., error rate > 5%)
4. Add notification channels

---

## Quick Command Reference

### Project Setup
```bash
gcloud config set project hr-360-497706
gcloud services enable run.googleapis.com storage-api.googleapis.com
```

### Backend Deployment
```bash
docker build -t gcr.io/hr-360-497706/backend:latest backend/
docker push gcr.io/hr-360-497706/backend:latest
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-497706/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend Deployment
```bash
gsutil mb -l us-central1 gs://hr-360-web-app
gsutil mb -l us-central1 gs://hr-360-mobile-app
gsutil web set -m index.html -e index.html gs://hr-360-web-app
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

### Monitoring
```bash
gcloud run logs read hr-360-backend --limit 50
gsutil du -s gs://hr-360-web-app gs://hr-360-mobile-app
gcloud run services list
```

---

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
- Clear browser cache
- Check browser console for errors
- Verify API URL in .env files

### High latency
- Enable Cloud CDN (optional)
- Use regional endpoints
- Optimize image sizes

---

## Final URLs

After deployment:

**Web Console**
```
https://storage.googleapis.com/hr-360-web-app/index.html
```

**Mobile App**
```
https://storage.googleapis.com/hr-360-mobile-app/index.html
```

**Backend API**
```
https://hr-360-backend-xxxxx.run.app/api
```

---

## Estimated Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Set project | 1 min |
| 2 | Enable APIs | 2 min |
| 3 | Deploy backend | 10 min |
| 4 | Create buckets | 2 min |
| 5 | Build frontend | 5 min |
| 6 | Upload apps | 5 min |
| 7 | Configure env | 2 min |
| 8 | Verify | 5 min |
| 9 | Monitor | 5 min |
| **Total** | | **~40 minutes** |

---

## Next Steps

1. ✅ Set project to HR 360
2. ✅ Enable required APIs
3. ✅ Deploy backend to Cloud Run
4. ✅ Create Cloud Storage buckets
5. ✅ Build frontend apps
6. ✅ Upload frontend apps
7. ✅ Configure environment variables
8. ✅ Verify deployment
9. ✅ Set up monitoring
10. ⏭️ Configure custom domain (optional)
11. ⏭️ Set up CI/CD pipeline (optional)

---

## Support

For detailed instructions, see:
- `GOOGLE_CLOUD_STEP_BY_STEP.md` - Complete step-by-step guide
- `GOOGLE_CLOUD_CLI_VS_CONSOLE.md` - CLI vs Console comparison
- `GOOGLE_CLOUD_CREDITS_PRICING.md` - Pricing information

---

**Status**: Ready to deploy
**Project**: HR 360 (hr-360-497706)
**Estimated Time**: 40 minutes
