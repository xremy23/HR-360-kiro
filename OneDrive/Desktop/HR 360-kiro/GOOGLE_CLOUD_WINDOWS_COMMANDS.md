# Google Cloud Deployment - Windows PowerShell Commands

**For Windows Users**: Use these commands instead of the bash versions in the deployment guide.

---

## PART 1: SETUP & PREREQUISITES

### Step 1.1: Verify Google Cloud CLI is Installed

```powershell
gcloud --version
```

If not installed, download from: https://cloud.google.com/sdk/docs/install-gcloud-cli

### Step 1.2: Authenticate with Google Cloud

```powershell
gcloud auth login
```

This will open a browser for you to sign in.

### Step 1.3: Verify Docker is Installed

```powershell
docker --version
```

If not installed, download from: https://www.docker.com/products/docker-desktop

---

## PART 2: CREATE GOOGLE CLOUD PROJECT

### Step 2.1: Create Project

```powershell
gcloud projects create hr-360-app --name="HR 360 Emergency App"
```

### Step 2.2: Set Project as Default

```powershell
gcloud config set project hr-360-app
```

### Step 2.3: Verify Project

```powershell
gcloud config list
```

Should show: `project = hr-360-app`

### Step 2.4: Enable Required APIs (WINDOWS VERSION)

**Option A: One command at a time (EASIEST)**

```powershell
gcloud services enable run.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

**Option B: All at once (ADVANCED)**

```powershell
gcloud services enable run.googleapis.com, storage-api.googleapis.com, compute.googleapis.com, cloudresourcemanager.googleapis.com
```

---

## PART 3: DEPLOY BACKEND TO CLOUD RUN

### Step 3.1: Navigate to Backend Directory

```powershell
cd backend
```

### Step 3.2: Build Docker Image

```powershell
docker build -t gcr.io/hr-360-app/backend:latest .
```

**Expected output:**
```
Successfully built [image-id]
Successfully tagged gcr.io/hr-360-app/backend:latest
```

### Step 3.3: Push Image to Google Container Registry

```powershell
docker push gcr.io/hr-360-app/backend:latest
```

**Expected output:**
```
Pushed [image-id]
gcr.io/hr-360-app/backend:latest: digest: sha256:...
```

### Step 3.4: Deploy to Cloud Run

**Option A: Simple deployment (RECOMMENDED)**

```powershell
gcloud run deploy hr-360-backend `
  --image gcr.io/hr-360-app/backend:latest `
  --platform managed `
  --region us-central1 `
  --memory 512Mi `
  --cpu 1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production"
```

**Option B: If Option A doesn't work, use this format:**

```powershell
gcloud run deploy hr-360-backend --image gcr.io/hr-360-app/backend:latest --platform managed --region us-central1 --memory 512Mi --cpu 1 --allow-unauthenticated --set-env-vars "NODE_ENV=production"
```

**Expected output:**
```
Service [hr-360-backend] revision [hr-360-backend-00001-xxx] has been deployed
Service URL: https://hr-360-backend-xxxxx.run.app
```

### Step 3.5: Save Backend URL

Copy the service URL (e.g., `https://hr-360-backend-xxxxx.run.app`)

### Step 3.6: Test Backend

```powershell
curl https://hr-360-backend-xxxxx.run.app/api/health
```

Should return: `{"status":"ok"}`

---

## PART 4: BUILD FRONTEND APPS

### Step 4.1: Build Web App

```powershell
cd ../web
npm run build
```

### Step 4.2: Build Mobile App

```powershell
cd ../mobile
npm run build
```

### Step 4.3: Verify Build Outputs

```powershell
dir ../web/dist/
dir ../mobile/dist/
```

Both should contain:
- `index.html`
- `assets/` folder
- Other static files

---

## PART 5: CREATE CLOUD STORAGE BUCKETS

### Step 5.1: Create Web App Bucket

```powershell
gsutil mb -l us-central1 gs://hr-360-web-app
```

### Step 5.2: Create Mobile App Bucket

```powershell
gsutil mb -l us-central1 gs://hr-360-mobile-app
```

### Step 5.3: Configure Web App Bucket for Hosting

```powershell
gsutil web set -m index.html -e index.html gs://hr-360-web-app
```

### Step 5.4: Configure Mobile App Bucket for Hosting

```powershell
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app
```

### Step 5.5: Make Web App Public

```powershell
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app
```

### Step 5.6: Make Mobile App Public

```powershell
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app
```

---

## PART 6: UPLOAD FRONTEND APPS

### Step 6.1: Upload Web App

```powershell
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
```

### Step 6.2: Upload Mobile App

```powershell
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

### Step 6.3: Verify Uploads

```powershell
gsutil ls gs://hr-360-web-app/
gsutil ls gs://hr-360-mobile-app/
```

Both should show:
- `index.html`
- `assets/`
- Other files

---

## PART 7: UPDATE FRONTEND CONFIGURATION

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

```powershell
cd web
npm run build
```

### Step 7.4: Rebuild Mobile App

```powershell
cd ../mobile
npm run build
```

### Step 7.5: Re-upload Web App

```powershell
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
```

### Step 7.6: Re-upload Mobile App

```powershell
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/
```

---

## PART 8: VERIFY DEPLOYMENT

### Step 8.1: Test Backend API

```powershell
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

### Step 8.3: Access Mobile App

Open in browser:
```
https://storage.googleapis.com/hr-360-mobile-app/index.html
```

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

## TROUBLESHOOTING

### Issue: "gcloud command not found"
**Solution**: Install Google Cloud CLI from https://cloud.google.com/sdk/docs/install-gcloud-cli

### Issue: "docker command not found"
**Solution**: Install Docker Desktop from https://www.docker.com/products/docker-desktop

### Issue: "Permission denied" when pushing Docker image
**Solution**: 
```powershell
gcloud auth configure-docker
```

Then try pushing again.

### Issue: "Bucket already exists"
**Solution**: Use a different bucket name:
```powershell
gsutil mb -l us-central1 gs://hr-360-web-app-v2
```

### Issue: "Backend not responding"
**Solution**:
```powershell
gcloud run logs read hr-360-backend --limit 20
```

Check logs for errors.

### Issue: "Frontend apps not loading"
**Solution**:
```powershell
gsutil ls gs://hr-360-web-app/
gsutil iam get gs://hr-360-web-app/
```

Verify files are uploaded and bucket is public.

---

## QUICK REFERENCE - ALL COMMANDS IN ORDER

```powershell
# 1. Verify installations
gcloud --version
docker --version

# 2. Authenticate
gcloud auth login

# 3. Create project
gcloud projects create hr-360-app --name="HR 360 Emergency App"
gcloud config set project hr-360-app

# 4. Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# 5. Build and push Docker image
cd backend
docker build -t gcr.io/hr-360-app/backend:latest .
docker push gcr.io/hr-360-app/backend:latest

# 6. Deploy to Cloud Run
gcloud run deploy hr-360-backend `
  --image gcr.io/hr-360-app/backend:latest `
  --platform managed `
  --region us-central1 `
  --memory 512Mi `
  --cpu 1 `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production"

# 7. Build frontend apps
cd ../web
npm run build
cd ../mobile
npm run build

# 8. Create Cloud Storage buckets
gsutil mb -l us-central1 gs://hr-360-web-app
gsutil mb -l us-central1 gs://hr-360-mobile-app

# 9. Configure buckets for hosting
gsutil web set -m index.html -e index.html gs://hr-360-web-app
gsutil web set -m index.html -e index.html gs://hr-360-mobile-app

# 10. Make buckets public
gsutil iam ch allUsers:objectViewer gs://hr-360-web-app
gsutil iam ch allUsers:objectViewer gs://hr-360-mobile-app

# 11. Upload frontend apps
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/

# 12. Test deployment
curl https://hr-360-backend-xxxxx.run.app/api/health
```

---

## IMPORTANT NOTES FOR WINDOWS

### PowerShell Line Continuation
- Use backtick (`) at end of line to continue to next line
- Example:
  ```powershell
  gcloud run deploy hr-360-backend `
    --image gcr.io/hr-360-app/backend:latest `
    --platform managed
  ```

### Paths
- Use forward slashes (/) or backslashes (\) - both work
- Example: `cd backend` or `cd .\backend`

### Environment Variables
- Use `$env:VARIABLE_NAME` to access environment variables
- Example: `$env:VITE_API_URL`

### Curl Command
- If `curl` doesn't work, use `Invoke-WebRequest`:
  ```powershell
  Invoke-WebRequest https://hr-360-backend-xxxxx.run.app/api/health
  ```

---

## ESTIMATED TIME

- Prerequisites: 10 minutes
- Create project: 5 minutes
- Deploy backend: 15 minutes
- Build frontend: 10 minutes
- Create buckets: 5 minutes
- Upload frontend: 10 minutes
- Verify deployment: 10 minutes

**Total: 65 minutes (1 hour)**

---

**Last Updated**: May 28, 2026  
**Platform**: Windows PowerShell  
**Status**: Ready to deploy

