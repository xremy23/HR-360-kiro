# Google Cloud Deployment Guides - Summary

Complete deployment documentation for HR 360 to Google Cloud.

---

## Available Guides

### 1. **GOOGLE_CLOUD_STEP_BY_STEP.md** (60 minutes)
**For**: First-time deployment to Google Cloud
**Covers**:
- Prerequisites and setup (Google Cloud account, CLI, Docker)
- Creating Google Cloud project
- Deploying backend to Cloud Run
- Building frontend apps
- Creating Cloud Storage buckets
- Uploading frontend apps
- Configuring environment variables
- Verifying deployment
- Monitoring and maintenance
- Troubleshooting

**Best for**: Single project, simple deployment

---

### 2. **GOOGLE_CLOUD_ORGANIZATION_SETUP.md** (2-3 hours)
**For**: Enterprise deployments with multiple environments
**Covers**:
- Organization structure setup
- Parent project creation
- Multi-environment setup (dev, staging, prod)
- Shared resources project
- Billing and budget management
- IAM and access control
- Deployment pipeline setup
- Monitoring and logging
- Backup and disaster recovery
- Security best practices
- Cost optimization

**Best for**: Teams, multiple environments, enterprise

---

## Quick Start (60 minutes)

### Step 1: Prerequisites (10 min)
```bash
# Create Google Cloud account
# Install Google Cloud CLI
# Install Docker
# Authenticate with Google Cloud
gcloud auth login
```

### Step 2: Create Project (5 min)
```bash
gcloud projects create hr-360-app --name="HR 360"
gcloud config set project hr-360-app
gcloud services enable run.googleapis.com storage-api.googleapis.com
```

### Step 3: Deploy Backend (15 min)
```bash
cd backend
docker build -t gcr.io/hr-360-app/backend:latest .
docker push gcr.io/hr-360-app/backend:latest
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 4: Build Frontend (10 min)
```bash
cd ../web && npm run build && cd ..
cd ../mobile && npm run build && cd ..
```

### Step 5: Deploy Frontend (10 min)
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

### Step 6: Configure & Verify (10 min)
```bash
# Update .env files with backend URL
# Rebuild and re-upload frontend apps
# Test URLs in browser
```

---

## Deployment Paths

### Path A: Simple Deployment (Recommended for Startups)
**Time**: 60 minutes
**Cost**: ~$1-5/month
**Setup**: Single project, single region

**Use when**:
- Starting out
- Small team
- Single environment
- Simple infrastructure

**Follow**: `GOOGLE_CLOUD_STEP_BY_STEP.md`

---

### Path B: Enterprise Deployment (Recommended for Teams)
**Time**: 2-3 hours
**Cost**: ~$20-50/month
**Setup**: Multiple projects, multiple environments, centralized billing

**Use when**:
- Multiple teams
- Multiple environments (dev, staging, prod)
- Enterprise requirements
- Centralized management

**Follow**: `GOOGLE_CLOUD_ORGANIZATION_SETUP.md`

---

## Key Concepts

### Cloud Run (Backend)
- Serverless container platform
- Auto-scales from 0 to N instances
- Pay only for execution time
- Free tier: 2M requests/month

### Cloud Storage (Frontend)
- Object storage for static files
- Serves web apps directly
- CDN integration available
- Free tier: 5GB storage

### Cloud CDN (Optional)
- Global content delivery network
- Caches static files at edge
- Reduces latency
- Cost: $0.12/GB

### Service Accounts
- Machine-to-machine authentication
- Used for CI/CD pipelines
- Granular permission control

### IAM (Identity & Access Management)
- Role-based access control
- Predefined and custom roles
- Organization-level policies

---

## Deployment Checklist

### Before Deployment
- [ ] Google Cloud account created
- [ ] Billing enabled
- [ ] Google Cloud CLI installed
- [ ] Docker installed
- [ ] GitHub repository up to date
- [ ] Backend tests passing (777/777)
- [ ] Frontend apps built locally

### Backend Deployment
- [ ] Docker image built
- [ ] Image pushed to Container Registry
- [ ] Cloud Run service deployed
- [ ] Backend URL saved
- [ ] Backend tested with curl

### Frontend Deployment
- [ ] Web app built
- [ ] Mobile app built
- [ ] Storage buckets created
- [ ] Buckets configured for hosting
- [ ] Buckets made public
- [ ] Apps uploaded to buckets

### Configuration
- [ ] Web app .env updated
- [ ] Mobile app .env updated
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

## Cost Breakdown

| Service | Free Tier | Typical Cost |
|---------|-----------|--------------|
| Cloud Run | 2M requests/month | $0.40 per million |
| Cloud Storage | 5GB | $0.02 per GB/month |
| Cloud CDN | - | $0.12 per GB |
| Data Transfer | 1GB/month | $0.12 per GB |
| **Total** | **~$0/month** | **~$20-50/month** |

**With $300 free credits**: Run for several months at no cost

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
- Check browser console
- Verify API URL in .env

### High latency
- Enable Cloud CDN
- Use regional endpoints
- Optimize images

### Authentication failing
```bash
curl https://hr-360-backend-xxxxx.run.app/api/health
```

---

## Next Steps

1. ✅ Choose deployment path (A or B)
2. ✅ Follow appropriate guide
3. ⏭️ Deploy to Google Cloud
4. ⏭️ Test all features
5. ⏭️ Set up monitoring
6. ⏭️ Configure custom domain (optional)
7. ⏭️ Set up CI/CD pipeline (optional)
8. ⏭️ Configure backups (optional)

---

## Document Structure

```
Deployment Guides
├── GOOGLE_CLOUD_STEP_BY_STEP.md
│   ├── Part 1: Setup & Prerequisites
│   ├── Part 2: Create Project
│   ├── Part 3: Deploy Backend
│   ├── Part 4: Build Frontend
│   ├── Part 5: Create Storage
│   ├── Part 6: Upload Apps
│   ├── Part 7: Configure
│   ├── Part 8: Verify
│   ├── Part 9: Organization (Optional)
│   ├── Part 10: Monitoring
│   ├── Part 11: Troubleshooting
│   └── Part 12: Checklist
│
├── GOOGLE_CLOUD_ORGANIZATION_SETUP.md
│   ├── Part 1: Organization Structure
│   ├── Part 2: Parent Project
│   ├── Part 3: Multi-Environment
│   ├── Part 4: Shared Resources
│   ├── Part 5: Billing
│   ├── Part 6: IAM & Access
│   ├── Part 7: Deployment Pipeline
│   ├── Part 8: Monitoring & Logging
│   ├── Part 9: Deployment
│   ├── Part 10: Backup & DR
│   ├── Part 11: Security
│   ├── Part 12: Cost Optimization
│   └── Part 13: Checklist
│
└── DEPLOYMENT_GUIDES_SUMMARY.md (this file)
```

---

## Quick Reference Commands

### Project Setup
```bash
gcloud projects create hr-360-app --name="HR 360"
gcloud config set project hr-360-app
gcloud services enable run.googleapis.com storage-api.googleapis.com
```

### Backend Deployment
```bash
docker build -t gcr.io/hr-360-app/backend:latest backend/
docker push gcr.io/hr-360-app/backend:latest
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
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

## Support Resources

- **Google Cloud Documentation**: https://cloud.google.com/docs
- **Cloud Run Guide**: https://cloud.google.com/run/docs
- **Cloud Storage Guide**: https://cloud.google.com/storage/docs
- **Pricing Calculator**: https://cloud.google.com/products/calculator
- **Community Support**: https://stackoverflow.com/questions/tagged/google-cloud-platform

---

## Summary

You have two comprehensive deployment guides:

1. **Simple Path** (60 min) - For getting started quickly
2. **Enterprise Path** (2-3 hours) - For teams and multiple environments

Both guides include:
- Step-by-step instructions
- Command examples
- Troubleshooting tips
- Checklists
- Cost information

**Status**: Ready to deploy
**Estimated Time**: 60 minutes (simple) or 2-3 hours (enterprise)
**Cost**: $0-50/month (covered by free credits for first 90 days)
