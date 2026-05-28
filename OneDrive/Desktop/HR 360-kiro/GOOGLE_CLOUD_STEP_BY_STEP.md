# Google Cloud Deployment - Complete Step-by-Step Guide

Deploy HR 360 to Google Cloud from scratch. Estimated time: 60 minutes.

---

## PART 1: SETUP & PREREQUISITES (10 minutes)

### Step 1.1: Create Google Cloud Account
1. Go to https://cloud.google.com
2. Click **"Get started for free"**
3. Sign in with Google account
4. Accept terms and conditions
5. Add billing information (credit card required)
6. You'll receive **$300 in free credits** (valid 90 days)

### Step 1.2: Install Google Cloud CLI
**On Windows:**
1. Download installer: https://cloud.google.com/sdk/docs/install-gcloud-cli
2. Run the installer
3. Follow setup wizard
4. Open PowerShell and verify:
   ```powershell
   gcloud --version
   ```

**On Mac:**
```bash
brew install --cask google-cloud-sdk
gcloud init
```

**On Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Step 1.3: Install Docker
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and start Docker
3. Verify installation:
   ```bash
   docker --version
   ```

### Step 1.4: Authenticate with Google Cloud
```bash
gcloud auth login
```
- Browser opens
- Sign in with your Google account
- Click "Allow"
- Return to terminal

---

## PART 2: CREATE GOOGLE CLOUD PROJECT (5 minutes)

### Step 2.1: Create Project
```bash
gcloud projects create hr-360-app --name="HR 360 Emergency App"
```

### Step 2.2: Set Project as Default
```bash
gcloud config set project hr-360-app
```

### Step 2.3: Verify Project
```bash
gcloud config list
```
Should show: `project = hr-360-app`

### Step 2.4: Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  storage-api.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com
```

This enables:
- Cloud Run (backend)
- Cloud Storage (frontend)
- Compute Engine (infrastructure)
- Cloud Resource Manager (project management)

---

## PART 3: DEPLOY BACKEND TO CLOUD RUN (15 minutes)

### Step 3.1: Navigate to Backend Directory
```bash
cd backend
```

### Step 3.2: Build Docker Image
```bash
docker build -t gcr.io/hr-360-app/backend:latest .
```

**What this does:**
- Reads `Dockerfile` in backend folder
- Installs dependencies
- Builds Node.js application
- Creates Docker image

**Expected output:**
```
Successfully built [image-id]
Successfully tagged gcr.io/hr-360-app/backend:latest
```

### Step 3.3: Push Image to Google Container Registry
```bash
docker push gcr.io/hr-360-app/backend:latest
```

**What this does:**
- Uploads Docker image to Google's container registry
- Makes it available for Cloud Run

**Expected output:**
```
Pushed [image-id]
gcr.io/hr-360-app/backend:latest: digest: sha256:...
```

### Step 3.4: Deploy to Cloud Run
```bash
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

**Parameters explained:**
- `--image`: Docker image to deploy
- `--platform managed`: Fully managed Cloud Run
- `--region us-central1`: Deploy to US Central region (cheapest)
- `--memory 512Mi`: 512MB RAM per instance
- `--cpu 1`: 1 CPU per instance
- `--allow-unauthenticated`: Allow public access
- `--set-env-vars`: Environment variables

**Expected output:**
```
Service [hr-360-backend] revision [hr-360-backend-00001-xxx] has been deployed
Service URL: https://hr-360-backend-xxxxx.run.app
```

### Step 3.5: Save Backend URL
Copy the service URL (e.g., `https://hr-360-backend-xxxxx.run.app`)
You'll need this for frontend configuration.

### Step 3.6: Test Backend
```bash
curl https://hr-360-backend-xxxxx.run.app/api/health
```

Should return: `{"status":"ok"}`

---

## PART 4: BUILD FRONTEND APPS (10 minutes)

### Step 4.1: Build Web App
```bash
cd ../web
npm run build
```

**What this does:**
- Compiles React code
- Optimizes for production
- Creates `dist` folder with static files

**Expected output:**
```
✓ built in 45.23s
```

### Step 4.2: Build Mobile App
```bash
cd ../mobile
npm run build
```

**What this does:**
- Exports Expo app for web
- Creates `dist` folder with static files

**Expected output:**
```
✓ built in 60.15s
```

### Step 4.3: Verify Build Outputs
```bash
ls -la ../web/dist/
ls -la ../mobile/dist/
```

Both should contain:
- `index.html`
- `assets/` folder
- Other static files

---

## PART 5: CREATE CLOUD STORAGE BUCKETS (10 minutes)

### Step 5.1: Create Web App Bucket
```bash
gsutil mb -l us-central1 gs://hr-360-web-app
```

**What this does:**
- Creates storage bucket for web app
- Located in us-central1 region

### Step 5.2: Create Mobile App Bucket
```bash
gsutil mb -l us-central1 gs://hr-360-mobile-app
```

### Step 5.3: Configure Web App Bucket for Hosting
```bash
gsutil web set -m index.html -e index.html gs://hr-360-web-app
```

**What this does:**
- Sets `index.html` as default page
- Redirects 404s to `index.html` (for React Router)

### Step 5.4: Configure Mobile App Bucket for Hosting
```bash
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app
```

### Step 5.5: Make Web App Public
```bash
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app
```

**What this does:**
- Allows anyone to read files
- Required for public access

### Step 5.6: Make Mobile App Public
```bash
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app
```

---

## PART 6: UPLOAD FRONTEND APPS (10 minutes)

### Step 6.1: Upload Web App
```bash
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
```

**What this does:**
- Uploads all files from `web/dist/` to bucket
- `-m` flag enables parallel uploads (faster)

**Expected output:**
```
Copying gs://hr-360-web-app/index.html
Copying gs://hr-360-web-app/assets/...
[100%] Done
```

### Step 6.2: Upload Mobile App
```bash
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

### Step 6.3: Verify Uploads
```bash
gsutil ls gs://hr-360-web-app/
gsutil ls gs://hr-360-mobile-app/
```

Both should show:
- `index.html`
- `assets/`
- Other files

---

## PART 7: UPDATE FRONTEND CONFIGURATION (5 minutes)

### Step 7.1: Update Web App Environment
Edit `web/.env`:
```
VITE_API_URL=https://hr-360-backend-xxxxx.run.app/api
VITE_ENV=production
```

Replace `xxxxx` with your actual backend URL from Step 3.5

### Step 7.2: Update Mobile App Environment
Edit `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://hr-360-backend-xxxxx.run.app/api
EXPO_PUBLIC_ENV=production
```

### Step 7.3: Rebuild Web App
```bash
cd web
npm run build
```

### Step 7.4: Rebuild Mobile App
```bash
cd ../mobile
npm run build
```

### Step 7.5: Re-upload Web App
```bash
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
```

### Step 7.6: Re-upload Mobile App
```bash
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

---

## PART 8: VERIFY DEPLOYMENT (5 minutes)

### Step 8.1: Test Backend API
```bash
curl https://hr-360-backend-xxxxx.run.app/api/health
```

Expected response:
```json
{"status":"ok"}
```

### Step 8.2: Access Web Console
Open in browser:
```
https://storage.googleapis.com/hr-360-web-app/index.html
```

You should see:
- Login page
- Email verification form
- Navigation to dashboard

### Step 8.3: Access Mobile App
Open in browser (or mobile device):
```
https://storage.googleapis.com/hr-360-mobile-app/index.html
```

You should see:
- Mobile app interface
- Home screen with quick actions
- Navigation tabs

### Step 8.4: Test Device Redirects
**On mobile device:**
- Visit web app URL
- Should redirect to mobile app URL

**On desktop:**
- Visit mobile app URL
- Should redirect to web app URL

### Step 8.5: Test Authentication
1. Go to web app
2. Enter email address
3. Check email for verification code
4. Enter code
5. Should redirect to dashboard

---

## PART 9: ORGANIZATION & STRUCTURE (Optional but Recommended)

### Step 9.1: Create Folder Structure in Google Cloud Console
1. Go to https://console.cloud.google.com
2. Navigate to **Cloud Storage**
3. Create folders in buckets:
   ```
   gs://hr-360-web-app/
   ├── assets/
   ├── images/
   └── index.html
   
   gs://hr-360-mobile-app/
   ├── assets/
   ├── images/
   └── index.html
   ```

### Step 9.2: Set Up Cloud CDN (Optional)
For faster global access:

```bash
gcloud compute backend-buckets create hr-360-web-backend \
  --gcs-uri-prefix=gs://hr-360-web-app \
  --enable-cdn

gcloud compute backend-buckets create hr-360-mobile-backend \
  --gcs-uri-prefix=gs://hr-360-mobile-app \
  --enable-cdn
```

### Step 9.3: Create Load Balancer (Optional)
For custom domain and HTTPS:

```bash
gcloud compute url-maps create hr-360-lb \
  --default-backend-bucket hr-360-web-backend
```

---

## PART 10: MONITORING & MAINTENANCE (Ongoing)

### Step 10.1: View Backend Logs
```bash
gcloud run logs read hr-360-backend --limit 50
```

### Step 10.2: View Storage Usage
```bash
gsutil du -s gs://hr-360-web-app gs://hr-360-mobile-app
```

### Step 10.3: Set Up Budget Alerts
1. Go to https://console.cloud.google.com/billing
2. Click **Budgets and alerts**
3. Create budget (e.g., $50/month)
4. Set alert threshold (e.g., 50%, 90%, 100%)

### Step 10.4: Monitor Costs
1. Go to **Billing** → **Reports**
2. View spending by service
3. Check Cloud Run, Storage, CDN costs

### Step 10.5: View Deployment Status
```bash
gcloud run services list
gcloud run services describe hr-360-backend --region us-central1
```

---

## PART 11: TROUBLESHOOTING

### Issue: Backend not responding
**Solution:**
```bash
gcloud run logs read hr-360-backend --limit 20
```
Check logs for errors

### Issue: Frontend apps not loading
**Solution:**
```bash
gsutil ls gs://hr-360-web-app/
gsutil iam get gs://hr-360-web-app/
```
Verify files are uploaded and bucket is public

### Issue: Device redirects not working
**Solution:**
- Clear browser cache
- Check browser console for errors
- Verify API URL in .env files

### Issue: High latency
**Solution:**
- Enable Cloud CDN
- Use regional endpoints
- Optimize image sizes

### Issue: Authentication failing
**Solution:**
```bash
curl https://hr-360-backend-xxxxx.run.app/api/auth/test-code/test@example.com
```
Check if backend is responding

---

## PART 12: DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Google Cloud account created
- [ ] Billing enabled
- [ ] Google Cloud CLI installed
- [ ] Docker installed
- [ ] GitHub repository up to date

### Backend Deployment
- [ ] Docker image built
- [ ] Image pushed to Container Registry
- [ ] Cloud Run service deployed
- [ ] Backend URL saved
- [ ] Backend tested

### Frontend Deployment
- [ ] Web app built
- [ ] Mobile app built
- [ ] Storage buckets created
- [ ] Buckets configured for hosting
- [ ] Buckets made public
- [ ] Apps uploaded to buckets

### Configuration
- [ ] Web app .env updated with backend URL
- [ ] Mobile app .env updated with backend URL
- [ ] Apps rebuilt with new config
- [ ] Apps re-uploaded to buckets

### Verification
- [ ] Backend API responding
- [ ] Web app loading
- [ ] Mobile app loading
- [ ] Device redirects working
- [ ] Authentication working
- [ ] Real-time features working

### Monitoring
- [ ] Budget alerts set up
- [ ] Logs accessible
- [ ] Cost monitoring enabled
- [ ] Backup strategy planned

---

## FINAL URLS

After deployment, you'll have:

**Web Console (Admin/HR Dashboard)**
```
https://storage.googleapis.com/hr-360-web-app/index.html
```

**Mobile App (Employee Emergency App)**
```
https://storage.googleapis.com/hr-360-mobile-app/index.html
```

**Backend API**
```
https://hr-360-backend-xxxxx.run.app/api
```

---

## COST SUMMARY

| Service | Free Tier | Typical Cost |
|---------|-----------|--------------|
| Cloud Run | 2M requests/month | $0.40 per million |
| Cloud Storage | 5GB | $0.02 per GB/month |
| Cloud CDN | - | $0.12 per GB |
| Data Transfer | 1GB/month | $0.12 per GB |
| **Total** | **~$0/month** | **~$20-50/month** |

With $300 free credits, you can run for several months at no cost.

---

## NEXT STEPS

1. ✅ Deploy to Google Cloud (this guide)
2. ⏭️ Set up custom domain (optional)
3. ⏭️ Configure SSL certificate (optional)
4. ⏭️ Set up CI/CD pipeline (optional)
5. ⏭️ Configure database backups (optional)
6. ⏭️ Set up monitoring and alerts (optional)

---

## QUICK REFERENCE COMMANDS

```bash
# Create project
gcloud projects create hr-360-app --name="HR 360"
gcloud config set project hr-360-app

# Enable APIs
gcloud services enable run.googleapis.com storage-api.googleapis.com

# Build and push Docker image
docker build -t gcr.io/hr-360-app/backend:latest backend/
docker push gcr.io/hr-360-app/backend:latest

# Deploy to Cloud Run
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Create storage buckets
gsutil mb -l us-central1 gs://hr-360-web-app
gsutil mb -l us-central1 gs://hr-360-mobile-app

# Configure for hosting
gsutil web set -m index.html -e index.html gs://hr-360-web-app
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app

# Make public
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app

# Upload apps
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/

# View logs
gcloud run logs read hr-360-backend --limit 50

# View services
gcloud run services list
```

---

## SUPPORT

For issues:
1. Check logs: `gcloud run logs read hr-360-backend`
2. Check bucket contents: `gsutil ls gs://hr-360-web-app/`
3. Check permissions: `gsutil iam get gs://hr-360-web-app/`
4. Review Google Cloud documentation: https://cloud.google.com/docs

---

**Estimated Total Time: 60 minutes**
**Status: Ready to deploy**
