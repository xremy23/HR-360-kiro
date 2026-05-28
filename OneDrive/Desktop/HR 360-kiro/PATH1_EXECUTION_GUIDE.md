# Path 1 Execution Guide - Vercel + Google Cloud

**Date**: May 28, 2026  
**Total Time**: ~60 minutes  
**Status**: Ready to execute

---

## 📋 Overview

```
Step 1: Deploy Web Console to Vercel (5 min)
    ↓
Step 2: Deploy Backend to Google Cloud (45 min)
    ├─ 2a: Set up Cloud SQL Database (15 min)
    └─ 2b: Deploy Backend to Cloud Run (20 min)
    ↓
Step 3: Connect Services (5 min)
    ↓
Step 4: Test Everything (5 min)
```

---

## ✅ Step 1: Deploy Web Console to Vercel (5 minutes)

### 1.1: Create Vercel Account

1. Open browser: https://vercel.com
2. Click **Sign Up**
3. Click **Continue with GitHub**
4. Authorize Vercel to access your GitHub
5. You're logged in!

### 1.2: Import Your Repository

1. Click **New Project**
2. You should see your `hr360` repository
3. Click **Import** next to it
4. Click **Import** again to confirm

### 1.3: Configure Project

1. **Project name**: `hr360` (or keep default)
2. **Framework**: Should auto-detect as Vite
3. Click **Deploy**
4. Wait for deployment (2-3 minutes)

### 1.4: Get Your Vercel URL

1. Deployment completes
2. You get a URL like: `https://hr360-xxxxx.vercel.app`
3. **Copy this URL** - you'll need it later
4. Click the URL to verify web console loads

✅ **Web console is live!**

**Your Vercel URL**: `https://hr360-xxxxx.vercel.app`

---

## ✅ Step 2: Deploy Backend to Google Cloud (45 minutes)

### 2.0: Create Google Cloud Account

1. Open browser: https://cloud.google.com
2. Click **Get started for free**
3. Sign in with Google account
4. Accept terms
5. Add billing information (won't charge without permission)
6. Click **Create Project**
7. **Project name**: `hr360-prod`
8. Click **Create**

### 2a: Set Up Cloud SQL Database (15 minutes)

#### 2a.1: Create PostgreSQL Instance

1. In Google Cloud Console, search: **Cloud SQL**
2. Click **Cloud SQL** from results
3. Click **Create Instance**
4. Select **PostgreSQL**
5. Configure:
   - **Instance ID**: `hr360-db`
   - **Password**: Generate strong password (copy it!)
   - **Region**: Choose closest to you (e.g., `us-central1`)
   - **Zonal availability**: Single zone (free tier)
   - **Machine type**: `db-f1-micro` (free tier)
   - **Storage**: `10 GB` (free tier)
6. Click **Create Instance**
7. Wait for creation (5-10 minutes)

#### 2a.2: Create Database

1. Click your instance: `hr360-db`
2. Click **Databases** tab
3. Click **Create database**
4. **Database name**: `hr360`
5. Click **Create**

#### 2a.3: Get Connection Details

1. Go back to instance: `hr360-db`
2. Copy **Public IP address** (e.g., `35.192.xxx.xxx`)
3. **Save this information**:
   ```
   Host: 35.192.xxx.xxx
   Port: 5432
   Database: hr360
   User: postgres
   Password: (the password you generated)
   ```

✅ **Database is ready!**

### 2b: Deploy Backend to Cloud Run (20 minutes)

#### 2b.1: Create Cloud Run Service

1. Search: **Cloud Run**
2. Click **Cloud Run** from results
3. Click **Create Service**
4. Configure:
   - **Service name**: `hr360-backend`
   - **Region**: Same as Cloud SQL (e.g., `us-central1`)
   - **Authentication**: Select **Allow unauthenticated invocations**
5. Click **Create**

#### 2b.2: Add Environment Variables

1. Click **Edit & Deploy New Revision**
2. Go to **Runtime settings** (expand)
3. Go to **Environment variables**
4. Add these variables:

```
NODE_ENV = production
DATABASE_URL = postgres://postgres:PASSWORD@HOST:5432/hr360
JWT_SECRET = (generate 32+ random characters)
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-password
SMTP_FROM = noreply@hr360.com
```

**Replace**:
- `PASSWORD` = your database password
- `HOST` = your Cloud SQL public IP
- `JWT_SECRET` = generate random string
- `SMTP_USER` = your Gmail address
- `SMTP_PASSWORD` = Gmail app password

#### 2b.3: Deploy

1. Click **Deploy**
2. Wait for deployment (5-10 minutes)
3. You get a URL like: `https://hr360-backend-xxxxx.run.app`
4. **Copy this URL** - you'll need it next

✅ **Backend is live!**

**Your Google Cloud Backend URL**: `https://hr360-backend-xxxxx.run.app`

---

## ✅ Step 3: Connect Services (5 minutes)

### 3.1: Update Vercel Environment Variables

1. Go to Vercel: https://vercel.com
2. Click your `hr360` project
3. Click **Settings**
4. Click **Environment Variables**
5. Add/Update:
   ```
   VITE_API_URL = https://hr360-backend-xxxxx.run.app/api
   VITE_WS_URL = wss://hr360-backend-xxxxx.run.app
   ```
   (Replace with your actual Google Cloud URL)
6. Click **Save**

### 3.2: Redeploy Vercel

1. Go to **Deployments** tab
2. Click the latest deployment
3. Click **Redeploy**
4. Wait for redeployment (2-3 minutes)

✅ **Services are connected!**

---

## ✅ Step 4: Test Everything (5 minutes)

### 4.1: Test Backend Health

```bash
# Replace with your actual URL
curl https://hr360-backend-xxxxx.run.app/health

# Expected response:
# {"status":"ok","timestamp":"2026-05-28T..."}
```

### 4.2: Test Web Console

1. Open browser: `https://hr360-xxxxx.vercel.app`
2. Web console should load
3. Try logging in
4. Check browser console for errors

### 4.3: Check Logs

**Google Cloud Logs**:
1. Go to Google Cloud Console
2. Search: **Cloud Run**
3. Click your service: `hr360-backend`
4. Click **Logs** tab
5. Check for errors

**Vercel Logs**:
1. Go to Vercel
2. Click your project
3. Click **Deployments**
4. Click latest deployment
5. Check logs

### 4.4: Test API Calls

```bash
# Test authentication
curl -X POST https://hr360-backend-xxxxx.run.app/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected: Should return success or error (not 500)
```

✅ **Everything is working!**

---

## 📊 What You Now Have

```
✅ Web Console
   URL: https://hr360-xxxxx.vercel.app
   Status: Live and accessible

✅ Backend API
   URL: https://hr360-backend-xxxxx.run.app
   Status: Live and responding

✅ Database
   Type: PostgreSQL
   Host: Cloud SQL
   Status: Connected

✅ Services Connected
   Web console can call backend API
   Backend can access database
```

---

## 🔐 Important Information to Save

**Save these for future reference**:

```
VERCEL
├─ Project URL: https://hr360-xxxxx.vercel.app
├─ Dashboard: https://vercel.com/dashboard
└─ Settings: https://vercel.com/dashboard/hr360/settings

GOOGLE CLOUD
├─ Backend URL: https://hr360-backend-xxxxx.run.app
├─ Cloud SQL Host: 35.192.xxx.xxx
├─ Database: hr360
├─ User: postgres
├─ Password: (your database password)
└─ Console: https://console.cloud.google.com

CREDENTIALS
├─ JWT_SECRET: (your 32+ char secret)
├─ SMTP_USER: your-email@gmail.com
└─ SMTP_PASSWORD: (your app password)
```

---

## 🆘 Troubleshooting

### Issue: Vercel deployment fails

**Solution**:
1. Check build logs in Vercel
2. Verify `package.json` has correct scripts
3. Check for missing dependencies
4. Try redeploying

### Issue: Google Cloud deployment fails

**Solution**:
1. Check Cloud Run logs
2. Verify environment variables are set
3. Check database connection string
4. Verify Cloud SQL instance is running

### Issue: Web console can't reach backend

**Solution**:
1. Verify `VITE_API_URL` is correct in Vercel
2. Check backend is running (test health endpoint)
3. Check CORS settings in backend
4. Verify network connectivity

### Issue: Database connection fails

**Solution**:
1. Verify connection string is correct
2. Check Cloud SQL instance is running
3. Verify database exists
4. Check username/password

---

## 📋 Deployment Checklist

### Vercel Deployment
- [ ] Vercel account created
- [ ] GitHub connected
- [ ] Repository imported
- [ ] Project deployed
- [ ] URL obtained
- [ ] Web console loads

### Google Cloud Setup
- [ ] Google Cloud account created
- [ ] Project created
- [ ] Cloud SQL instance created
- [ ] Database created
- [ ] Connection details saved

### Google Cloud Backend
- [ ] Cloud Run service created
- [ ] Environment variables set
- [ ] Backend deployed
- [ ] URL obtained
- [ ] Health check passes

### Connection
- [ ] Vercel environment variables updated
- [ ] Vercel redeployed
- [ ] Web console can reach backend
- [ ] API calls working

### Testing
- [ ] Backend health check passes
- [ ] Web console loads
- [ ] No errors in logs
- [ ] API calls successful

---

## 🎉 Success Indicators

✅ **Deployment is successful when**:
- Web console loads at Vercel URL
- Backend responds to health check
- Web console can call backend API
- No errors in logs
- Database is connected
- All services are running

---

## 📞 Next Steps

### Immediate (Today)
1. ✅ Deploy web console to Vercel
2. ✅ Deploy backend to Google Cloud
3. ✅ Connect services
4. ✅ Test everything

### Short-term (This Week)
1. Set up monitoring and alerts
2. Configure backups
3. Test with real data
4. Invite team members

### Medium-term (This Month)
1. Set up custom domain
2. Configure SSL certificate
3. Optimize performance
4. Plan next features

---

## 📚 Documentation

| Need | Read This |
|------|-----------|
| Vercel details | DEPLOY_VERCEL.md |
| Google Cloud details | DEPLOY_GOOGLE_CLOUD.md |
| Troubleshooting | DEPLOYMENT_GUIDE.md |
| Full reference | DEPLOYMENT_GUIDE.md |

---

## ✅ Summary

**You're deploying**:
1. Web console to Vercel (5 min)
2. Backend to Google Cloud (45 min)
3. Connecting them (5 min)
4. Testing (5 min)

**Total time**: ~60 minutes

**Result**: Full-stack app live on the internet!

---

**Status**: ✅ **READY TO EXECUTE PATH 1**

**Generated**: May 28, 2026

---

## 🚀 Ready? Let's Go!

Start with **Step 1: Deploy Web Console to Vercel**

Follow each step carefully and save all URLs and credentials.

Good luck! 🎉
