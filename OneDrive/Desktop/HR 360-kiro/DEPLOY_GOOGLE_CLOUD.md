# Deploy to Google Cloud - HR 360 App

**Time Required**: 45-60 minutes  
**Difficulty**: Intermediate  
**Cost**: Free tier available ($300 credit)

---

## 🎯 Why Google Cloud?

✅ **Perfect for full stack** - Backend + Database + Frontend  
✅ **Free tier** - $300 credit for 3 months  
✅ **Cloud Run** - Serverless containers  
✅ **Cloud SQL** - Managed PostgreSQL  
✅ **Cloud Storage** - File storage  
✅ **Global infrastructure** - Fast worldwide  

---

## 📋 What We'll Deploy

```
Google Cloud
    │
    ├─ Cloud Run (Backend API)
    │   └─ Node.js + Express
    │
    ├─ Cloud SQL (Database)
    │   └─ PostgreSQL
    │
    ├─ Cloud Storage (Files)
    │   └─ Backups, logs
    │
    └─ Cloud CDN (Frontend)
        └─ React web console
```

---

## 🚀 Step 1: Create Google Cloud Account

1. Go to: https://cloud.google.com
2. Click **Get started for free**
3. Sign in with Google account
4. Accept terms
5. Add billing information (won't charge without permission)
6. Create project: `hr360-prod`

---

## 🚀 Step 2: Set Up Cloud SQL (Database)

### Create PostgreSQL Instance

1. Go to: **Cloud SQL** (search in console)
2. Click **Create Instance**
3. Select **PostgreSQL**
4. Configure:
   - **Instance ID**: `hr360-db`
   - **Password**: Generate strong password
   - **Region**: Choose closest to you
   - **Machine type**: `db-f1-micro` (free tier)
5. Click **Create**

### Create Database

1. Go to your instance
2. Click **Databases** tab
3. Click **Create database**
4. Name: `hr360`
5. Click **Create**

### Get Connection String

1. Go to your instance
2. Copy **Public IP address**
3. Connection string:
```
postgres://postgres:PASSWORD@PUBLIC_IP:5432/hr360
```

---

## 🚀 Step 3: Set Up Cloud Run (Backend)

### Create Dockerfile

**File**: `backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Deploy to Cloud Run

1. Go to: **Cloud Run** (search in console)
2. Click **Create Service**
3. Configure:
   - **Service name**: `hr360-backend`
   - **Region**: Same as Cloud SQL
   - **Authentication**: Allow unauthenticated invocations
4. Click **Deploy**

### Set Environment Variables

1. Go to your Cloud Run service
2. Click **Edit & Deploy New Revision**
3. Go to **Environment variables**
4. Add:

```
NODE_ENV = production
DATABASE_URL = postgres://postgres:PASSWORD@CLOUD_SQL_IP:5432/hr360
REDIS_URL = redis://redis-host:6379
JWT_SECRET = your-32-character-secret
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-password
SMTP_FROM = noreply@hr360.com
```

5. Click **Deploy**

---

## 🚀 Step 4: Deploy Web Console

### Option A: Cloud Run (Easiest)

1. Create `web/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

2. Deploy to Cloud Run (same as backend)

### Option B: Vercel (Recommended)

1. Go to: https://vercel.com
2. Import your repository
3. Set environment variables:
   - `VITE_API_URL = https://your-cloud-run-backend-url/api`
4. Deploy

---

## 🚀 Step 5: Connect Services

### Update Backend URL in Web Console

1. Go to Vercel (or Cloud Run) web console settings
2. Set environment variable:
```
VITE_API_URL = https://hr360-backend-xxxxx.run.app/api
VITE_WS_URL = wss://hr360-backend-xxxxx.run.app
```

### Update Database Connection

1. Go to Cloud Run backend service
2. Update environment variable:
```
DATABASE_URL = postgres://postgres:PASSWORD@CLOUD_SQL_IP:5432/hr360
```

---

## ✅ Verification

### Test Backend

```bash
curl https://hr360-backend-xxxxx.run.app/health
```

### Test Web Console

```bash
curl https://hr360.vercel.app
```

### Check Logs

1. Go to **Cloud Run** service
2. Click **Logs** tab
3. Check for errors

---

## 📊 Google Cloud Pricing

| Service | Free Tier | Cost |
|---------|-----------|------|
| Cloud Run | 2M requests/month | $0.40/M after |
| Cloud SQL | 1 instance, 10GB | $0.10/hour after |
| Cloud Storage | 5GB | $0.020/GB after |
| **Total** | **Free** | **~$50-100/month** |

---

## 🔐 Security Setup

### Enable Cloud SQL Auth

1. Go to **Cloud SQL** instance
2. Click **Connections**
3. Enable **Cloud SQL Auth proxy**
4. Use connection string in Cloud Run

### Set Up Firewall

1. Go to **VPC Network** → **Firewall**
2. Create rule to allow Cloud Run to Cloud SQL
3. Restrict public access

### Enable SSL

1. Go to **Cloud Run** service
2. Enable **Require HTTPS**
3. Add custom domain (optional)

---

## 📈 Monitoring

### Set Up Alerts

1. Go to **Monitoring** → **Alerting**
2. Create alert for:
   - High error rate
   - High latency
   - High memory usage

### View Logs

1. Go to **Cloud Logging**
2. Filter by service
3. Search for errors

### Check Performance

1. Go to **Cloud Trace**
2. View request traces
3. Identify slow endpoints

---

## 🆘 Troubleshooting

### Issue: Cloud Run deployment fails

**Solution**:
1. Check Dockerfile syntax
2. Check build logs
3. Verify dependencies in package.json

### Issue: Database connection fails

**Solution**:
1. Verify connection string
2. Check Cloud SQL instance is running
3. Verify firewall rules

### Issue: Web console can't reach backend

**Solution**:
1. Verify backend URL in environment variables
2. Check CORS settings in backend
3. Verify backend is running

---

## 📋 Deployment Checklist

### Before Deployment
- [ ] Google Cloud account created
- [ ] Project created
- [ ] Billing enabled
- [ ] Dockerfile created
- [ ] Environment variables prepared

### During Deployment
- [ ] Cloud SQL instance created
- [ ] Database created
- [ ] Cloud Run backend deployed
- [ ] Web console deployed
- [ ] Environment variables set

### After Deployment
- [ ] Backend health check passes
- [ ] Web console loads
- [ ] API calls working
- [ ] Database connected
- [ ] Logs show no errors

---

## 🎯 Next Steps

1. **Create Google Cloud account**
2. **Set up Cloud SQL database**
3. **Deploy backend to Cloud Run**
4. **Deploy web console to Vercel**
5. **Connect services**
6. **Test everything**
7. **Set up monitoring**
8. **Configure backups**

---

## 📞 Google Cloud Resources

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts/build-and-deploy)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Google Cloud Free Tier](https://cloud.google.com/free)

---

## 💡 Pro Tips

1. **Use Cloud SQL Proxy** for secure connections
2. **Enable automatic backups** for database
3. **Set up Cloud Monitoring** for alerts
4. **Use Cloud Build** for automated deployments
5. **Enable Cloud CDN** for faster content delivery

---

**Status**: ✅ **READY FOR GOOGLE CLOUD DEPLOYMENT**

**Generated**: May 28, 2026
