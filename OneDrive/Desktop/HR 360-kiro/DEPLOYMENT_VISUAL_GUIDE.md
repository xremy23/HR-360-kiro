# Google Cloud Deployment - Visual Guide

Visual representation of the deployment process and architecture.

---

## Deployment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PROCESS                           │
└─────────────────────────────────────────────────────────────────┘

STEP 1: SETUP (10 min)
┌──────────────────────────────────────────────────────────────┐
│ • Create Google Cloud Account                                │
│ • Install Google Cloud CLI                                   │
│ • Install Docker                                             │
│ • Authenticate: gcloud auth login                            │
└──────────────────────────────────────────────────────────────┘
                            ↓

STEP 2: CREATE PROJECT (5 min)
┌──────────────────────────────────────────────────────────────┐
│ • Create project: gcloud projects create hr-360-app          │
│ • Set default: gcloud config set project hr-360-app          │
│ • Enable APIs: gcloud services enable run.googleapis.com     │
└──────────────────────────────────────────────────────────────┘
                            ↓

STEP 3: DEPLOY BACKEND (15 min)
┌──────────────────────────────────────────────────────────────┐
│ • Build Docker image: docker build -t gcr.io/.../backend     │
│ • Push to registry: docker push gcr.io/.../backend           │
│ • Deploy to Cloud Run: gcloud run deploy hr-360-backend      │
│ • Get backend URL: https://hr-360-backend-xxxxx.run.app      │
└──────────────────────────────────────────────────────────────┘
                            ↓

STEP 4: BUILD FRONTEND (10 min)
┌──────────────────────────────────────────────────────────────┐
│ • Build web app: cd web && npm run build                     │
│ • Build mobile app: cd mobile && npm run build               │
│ • Verify dist folders created                                │
└──────────────────────────────────────────────────────────────┘
                            ↓

STEP 5: CREATE STORAGE (5 min)
┌──────────────────────────────────────────────────────────────┐
│ • Create web bucket: gsutil mb gs://hr-360-web-app           │
│ • Create mobile bucket: gsutil mb gs://hr-360-mobile-app     │
│ • Configure for hosting: gsutil web set -m index.html        │
│ • Make public: gsutil iam ch allUsers:objectViewer           │
└──────────────────────────────────────────────────────────────┘
                            ↓

STEP 6: UPLOAD APPS (10 min)
┌──────────────────────────────────────────────────────────────┐
│ • Upload web: gsutil -m cp -r web/dist/* gs://hr-360-web    │
│ • Upload mobile: gsutil -m cp -r mobile/dist/* gs://hr-360  │
│ • Verify uploads: gsutil ls gs://hr-360-web-app/            │
└──────────────────────────────────────────────────────────────┘
                            ↓

STEP 7: CONFIGURE (5 min)
┌──────────────────────────────────────────────────────────────┐
│ • Update web/.env with backend URL                           │
│ • Update mobile/.env with backend URL                        │
│ • Rebuild: npm run build                                     │
│ • Re-upload to buckets                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓

STEP 8: VERIFY (5 min)
┌──────────────────────────────────────────────────────────────┐
│ • Test backend: curl https://hr-360-backend-xxxxx.run.app    │
│ • Open web app in browser                                    │
│ • Open mobile app in browser                                 │
│ • Test device redirects                                      │
│ • Test authentication                                        │
└──────────────────────────────────────────────────────────────┘

TOTAL TIME: ~60 minutes
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────┘

                        INTERNET USERS
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                    ▼         ▼         ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │  Desktop │ │ Mobile   │ │ Tablet   │
            │  Browser │ │ Browser  │ │ Browser  │
            └──────────┘ └──────────┘ └──────────┘
                    │         │         │
                    └─────────┼─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Device Detection │
                    │   & Redirects     │
                    └─────────┬─────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Cloud Run    │ │ Cloud        │ │ Cloud        │
        │ Backend API  │ │ Storage      │ │ Storage      │
        │              │ │ Web App      │ │ Mobile App   │
        │ Port 3000    │ │              │ │              │
        │              │ │ React PWA    │ │ Expo PWA     │
        │ 50+ Routes   │ │              │ │              │
        │              │ │ Admin/HR     │ │ Employee     │
        │ Node.js      │ │ Dashboard    │ │ Emergency    │
        │ Express      │ │              │ │ App          │
        │              │ │ Vite Build   │ │ Vite Build   │
        │ PostgreSQL   │ │              │ │              │
        │ Connection   │ │ Static Files │ │ Static Files │
        └──────────────┘ └──────────────┘ └──────────────┘
                │                │              │
                │                └──────┬───────┘
                │                       │
                │                ┌──────▼──────┐
                │                │ Cloud CDN   │
                │                │ (Optional)  │
                │                │ Global      │
                │                │ Caching     │
                │                └─────────────┘
                │
                ▼
        ┌──────────────────┐
        │ PostgreSQL DB    │
        │ (Cloud SQL)      │
        │                  │
        │ 14 Tables        │
        │ Users            │
        │ Organizations    │
        │ Check-Ins        │
        │ Alerts           │
        │ Incidents        │
        │ Contacts         │
        │ To-Go Bag        │
        │ KB Guides        │
        │ And more...      │
        └──────────────────┘
```

---

## Project Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PROJECT                         │
│                      (hr-360-app)                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ COMPUTE                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cloud Run Service: hr-360-backend                              │
│  ├── Image: gcr.io/hr-360-app/backend:latest                   │
│  ├── Region: us-central1                                        │
│  ├── Memory: 512Mi                                              │
│  ├── CPU: 1                                                     │
│  ├── Instances: 0-10 (auto-scaling)                             │
│  └── URL: https://hr-360-backend-xxxxx.run.app                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STORAGE                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bucket: hr-360-web-app                                         │
│  ├── Region: us-central1                                        │
│  ├── Files: index.html, assets/, etc.                           │
│  ├── Public: Yes                                                │
│  ├── Hosting: Enabled                                           │
│  └── URL: https://storage.googleapis.com/hr-360-web-app/       │
│                                                                 │
│  Bucket: hr-360-mobile-app                                      │
│  ├── Region: us-central1                                        │
│  ├── Files: index.html, assets/, etc.                           │
│  ├── Public: Yes                                                │
│  ├── Hosting: Enabled                                           │
│  └── URL: https://storage.googleapis.com/hr-360-mobile-app/    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CONTAINER REGISTRY                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Image: gcr.io/hr-360-app/backend:latest                        │
│  ├── Size: ~200MB                                               │
│  ├── Base: node:20-alpine                                       │
│  ├── Layers: Dependencies, Source, Build                        │
│  └── Status: Ready for deployment                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ NETWORKING (Optional)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cloud CDN (Optional)                                           │
│  ├── Backend: hr-360-web-backend                                │
│  ├── Backend: hr-360-mobile-backend                             │
│  ├── Caching: Enabled                                           │
│  └── TTL: 3600 seconds                                          │
│                                                                 │
│  Load Balancer (Optional)                                       │
│  ├── Type: Global HTTP(S)                                       │
│  ├── Backends: Web & Mobile                                     │
│  └── Custom Domain: (optional)                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

USER INTERACTION:
┌──────────────┐
│ User Opens   │
│ Web/Mobile   │
│ App          │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Browser Loads Static Files               │
│ (HTML, CSS, JS from Cloud Storage)       │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ React App Initializes                    │
│ Redux Store Setup                        │
│ Device Detection                         │
└──────┬───────────────────────────────────┘
       │
       ├─ Mobile Device? ──→ Redirect to Mobile App
       │
       └─ Desktop Device? ──→ Continue to Web App
                              │
                              ▼
                    ┌──────────────────────┐
                    │ User Enters Email    │
                    │ Requests Verification│
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ API Call to Backend  │
                    │ POST /auth/send-     │
                    │ verification         │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ Backend Generates    │
                    │ 6-Digit Code         │
                    │ Stores in Redis      │
                    │ Sends Email          │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ User Receives Email  │
                    │ Enters Code          │
                    │ Submits Form         │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ API Call to Backend  │
                    │ POST /auth/verify-   │
                    │ email                │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ Backend Verifies     │
                    │ Code                 │
                    │ Creates JWT Token    │
                    │ Stores Session       │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ Frontend Receives    │
                    │ JWT Token            │
                    │ Stores in Redux      │
                    │ Redirects to         │
                    │ Dashboard            │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ Dashboard Loads      │
                    │ Fetches Data from    │
                    │ Backend              │
                    │ WebSocket Connected  │
                    │ Real-time Updates    │
                    └──────────────────────┘
```

---

## Deployment Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TIMELINE                          │
└─────────────────────────────────────────────────────────────────┘

TIME    TASK                              STATUS
────────────────────────────────────────────────────────────────
0:00    Start                             ▓░░░░░░░░░░░░░░░░░░░░
0:10    Setup & Prerequisites             ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░
0:15    Create Project                    ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░
0:30    Deploy Backend                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░
0:40    Build Frontend                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
0:45    Create Storage                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░
0:55    Upload Apps                       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
1:00    Configure & Verify                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

TOTAL: 60 minutes
```

---

## Cost Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONTHLY COST BREAKDOWN                       │
└─────────────────────────────────────────────────────────────────┘

STARTUP SCENARIO (5M requests/month)
┌──────────────────────────────────────────────────────────────┐
│ Cloud Run:        $1.20  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Cloud Storage:    $0.02  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Data Transfer:    $1.20  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────────┤
│ TOTAL:            $2.42  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ FREE CREDITS:    $300.00 ████████████████████████████████████ │
│ MONTHS COVERED:   124    (10+ years)                          │
└──────────────────────────────────────────────────────────────┘

PRODUCTION SCENARIO (100M requests/month)
┌──────────────────────────────────────────────────────────────┐
│ Cloud Run:       $39.20  ████████████████░░░░░░░░░░░░░░░░░░░ │
│ Cloud Storage:    $0.04  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Data Transfer:   $12.00  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Cloud CDN:       $12.00  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────────┤
│ TOTAL:           $63.24  ███████████████████████░░░░░░░░░░░░ │
│ FREE CREDITS:   $300.00  ████████████████████████████████████ │
│ MONTHS COVERED:    4.7   (5 months)                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Service Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│              DEPLOYMENT OPTIONS COMPARISON                      │
└─────────────────────────────────────────────────────────────────┘

                    VERCEL      HEROKU      GOOGLE CLOUD
────────────────────────────────────────────────────────────────
Setup Time          5 min       10 min      15 min
Deployment Time     2 min       5 min       10 min
Free Tier           Yes         No          Yes ($300)
Startup Cost        $0          $7/month    $0
Production Cost     $20+        $50+        $20-50
Scalability         Good        Good        Excellent
Customization       Limited     Medium      Excellent
Database            Limited     Included    Separate
Monitoring          Basic       Good        Excellent
Support             Community   Community   Enterprise
────────────────────────────────────────────────────────────────

RECOMMENDATION: Google Cloud for flexibility and cost
```

---

## Deployment Checklist Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT CHECKLIST                         │
└─────────────────────────────────────────────────────────────────┘

SETUP PHASE
  ☐ Google Cloud account created
  ☐ Billing enabled
  ☐ Google Cloud CLI installed
  ☐ Docker installed
  ☐ GitHub repo up to date

BACKEND PHASE
  ☐ Docker image built
  ☐ Image pushed to registry
  ☐ Cloud Run deployed
  ☐ Backend URL saved
  ☐ Backend tested

FRONTEND PHASE
  ☐ Web app built
  ☐ Mobile app built
  ☐ Storage buckets created
  ☐ Buckets configured
  ☐ Buckets made public
  ☐ Apps uploaded

CONFIGURATION PHASE
  ☐ Web .env updated
  ☐ Mobile .env updated
  ☐ Apps rebuilt
  ☐ Apps re-uploaded

VERIFICATION PHASE
  ☐ Backend responding
  ☐ Web app loading
  ☐ Mobile app loading
  ☐ Device redirects working
  ☐ Authentication working
  ☐ Real-time features working

MONITORING PHASE
  ☐ Budget alerts set
  ☐ Logs accessible
  ☐ Cost monitoring enabled

STATUS: ████████████████████ 100% READY
```

---

## Quick Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT DECISION TREE                     │
└─────────────────────────────────────────────────────────────────┘

                    START HERE
                        │
                        ▼
            Is this your first deployment?
                    │           │
                   YES          NO
                    │           │
                    ▼           ▼
            Follow Simple    Follow Enterprise
            Path (60 min)    Path (2-3 hours)
                    │           │
                    ▼           ▼
            Single Project  Multiple Projects
            Single Region   Multiple Regions
            Simple Setup    Complex Setup
                    │           │
                    ▼           ▼
            GOOGLE_CLOUD_   GOOGLE_CLOUD_
            STEP_BY_STEP    ORGANIZATION_
            .md             SETUP.md
                    │           │
                    └─────┬─────┘
                          ▼
                    DEPLOY TO
                    GOOGLE CLOUD
                          │
                          ▼
                    TEST & VERIFY
                          │
                          ▼
                    MONITOR & MAINTAIN
```

---

## Summary

This visual guide shows:
- ✅ Complete deployment flow
- ✅ Architecture diagram
- ✅ Project structure
- ✅ Data flow
- ✅ Timeline
- ✅ Cost breakdown
- ✅ Service comparison
- ✅ Deployment checklist
- ✅ Decision tree

**Next Step**: Choose your deployment path and follow the appropriate guide!
