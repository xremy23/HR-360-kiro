# HR 360 - Ready for Google Cloud Deployment

Your entire application is now configured and ready to deploy to Google Cloud.

## What's Included

✅ **Backend**
- Node.js/Express API with 50+ endpoints
- 777/777 tests passing (100% pass rate)
- Dockerfile for containerization
- Ready for Cloud Run deployment

✅ **Web Console**
- React PWA with Redux state management
- Admin/HR dashboard
- Vite build configuration
- Ready for Cloud Storage deployment

✅ **Mobile App**
- Expo React Native PWA
- Employee emergency management app
- 7 screens with Redux integration
- Ready for Cloud Storage deployment

✅ **Device Detection**
- Automatic redirects between web and mobile apps
- Mobile users → mobile app
- Desktop users → web console

✅ **Deployment Scripts**
- `deploy-to-gcloud.sh` (Linux/Mac)
- `deploy-to-gcloud.bat` (Windows)
- Automated deployment in ~30 minutes

## Quick Start (30 minutes)

### Prerequisites
1. Google Cloud Account (free tier available)
2. Google Cloud CLI installed
3. Docker installed

### Step 1: Create Google Cloud Project
```bash
gcloud projects create hr-360-app --name="HR 360"
gcloud config set project hr-360-app
gcloud services enable run.googleapis.com storage-api.googleapis.com
```

### Step 2: Run Deployment Script

**On Windows:**
```bash
deploy-to-gcloud.bat
```

**On Linux/Mac:**
```bash
bash deploy-to-gcloud.sh
```

### Step 3: Update Frontend URLs

After deployment, you'll get:
- Backend URL: `https://hr-360-backend-xxxxx.run.app`
- Web URL: `https://storage.googleapis.com/hr-360-web-app/index.html`
- Mobile URL: `https://storage.googleapis.com/hr-360-mobile-app/index.html`

Update the frontend .env files:

**web/.env:**
```
VITE_API_URL=https://hr-360-backend-xxxxx.run.app/api
VITE_ENV=production
```

**mobile/.env:**
```
EXPO_PUBLIC_API_URL=https://hr-360-backend-xxxxx.run.app/api
EXPO_PUBLIC_ENV=production
```

Rebuild and redeploy:
```bash
cd web && npm run build && gsutil -m cp -r dist/* gs://hr-360-web-app/ && cd ..
cd mobile && npm run build && gsutil -m cp -r dist/* gs://hr-360-mobile-app/ && cd ..
```

## Architecture

```
Google Cloud Project (hr-360-app)
│
├── Cloud Run
│   └── hr-360-backend (Node.js/Express)
│       └── Port 3000
│       └── 50+ API endpoints
│
├── Cloud Storage
│   ├── hr-360-web-app (React PWA)
│   │   └── Admin/HR console
│   │   └── Desktop-optimized
│   │
│   └── hr-360-mobile-app (Expo PWA)
│       └── Employee app
│       └── Mobile-optimized
│
└── Cloud CDN (Optional)
    └── Caches static files globally
```

## URLs After Deployment

- **Web Console**: `https://storage.googleapis.com/hr-360-web-app/index.html`
- **Mobile App**: `https://storage.googleapis.com/hr-360-mobile-app/index.html`
- **Backend API**: `https://hr-360-backend-xxxxx.run.app/api`

## Device Redirects

- Access web URL on mobile → Redirects to mobile app
- Access mobile URL on desktop → Redirects to web console
- Seamless experience for all users

## Monitoring

```bash
# View backend logs
gcloud run logs read hr-360-backend --limit 50

# View storage usage
gsutil du -s gs://hr-360-web-app gs://hr-360-mobile-app

# View deployed services
gcloud run services list
```

## Cost Estimation

- **Cloud Run**: Free tier (2M requests/month)
- **Cloud Storage**: ~$0.02/GB/month
- **Cloud CDN**: ~$0.12/GB (optional)
- **Total**: ~$1-5/month

## Optional: Custom Domain

To use a custom domain (e.g., `hr360.com`):

1. Create a load balancer
2. Configure DNS records
3. Set up SSL certificate
4. Route traffic to Cloud Storage buckets

See `GOOGLE_CLOUD_DEPLOYMENT.md` for detailed steps.

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
- Verify API URL in .env files
- Clear browser cache

## Next Steps

1. ✅ Deploy to Google Cloud (30 min)
2. ⏭️ Set up database (Cloud SQL) for persistent data
3. ⏭️ Configure CI/CD for auto-deployment on GitHub push
4. ⏭️ Set up custom domain with SSL
5. ⏭️ Configure monitoring and alerts

## Documentation

- `GOOGLE_CLOUD_QUICKSTART.md` - Quick start guide
- `GOOGLE_CLOUD_DEPLOYMENT.md` - Detailed deployment guide
- `ARCHITECTURE.md` - System architecture
- `README.md` - Project overview

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Cloud documentation
3. Check backend logs: `gcloud run logs read hr-360-backend`
4. Check frontend browser console for errors

---

**Status**: ✅ Ready for deployment
**Last Updated**: May 28, 2026
**Deployment Time**: ~30 minutes
