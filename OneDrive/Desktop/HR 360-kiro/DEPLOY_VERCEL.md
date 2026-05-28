# Deploy to Vercel - HR 360 App

**Time Required**: 30-45 minutes  
**Difficulty**: Easy  
**Cost**: Free tier available

---

## 🎯 Why Vercel?

✅ **Easiest deployment** - No GitHub Secrets needed  
✅ **Free tier** - Perfect for testing  
✅ **Automatic deployments** - Push to GitHub, auto-deploys  
✅ **Built-in environment variables** - Easy to manage  
✅ **Global CDN** - Fast worldwide  
✅ **Serverless functions** - Perfect for Node.js backend  

---

## ⚠️ Important Note

**Vercel is best for**:
- Web console (React frontend)
- Serverless backend functions

**Vercel is NOT ideal for**:
- Full backend with database
- Long-running processes
- WebSocket connections

**Better option for full backend**: Google Cloud Run (see below)

---

## 🚀 Deploy Web Console to Vercel (Easy)

### Step 1: Create Vercel Account

1. Go to: https://vercel.com
2. Click **Sign Up**
3. Choose **GitHub** (easiest)
4. Authorize Vercel to access your GitHub

### Step 2: Import Project

1. Click **New Project**
2. Select your GitHub repository (`hr360`)
3. Click **Import**

### Step 3: Configure Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
VITE_API_URL = https://your-backend-url/api
VITE_WS_URL = wss://your-backend-url
```

3. Click **Save**

### Step 4: Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. You'll get a URL like: `https://hr360.vercel.app`

### Step 5: Verify

```bash
# Test your web console
curl https://hr360.vercel.app
```

---

## 🚀 Deploy Backend to Vercel (Advanced)

### Limitations

⚠️ **Vercel has limitations for backend**:
- No persistent storage (database)
- No long-running processes
- WebSocket connections limited
- Cold starts (slow first request)

### If You Still Want to Try

1. Create `vercel.json` in backend root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url",
    "REDIS_URL": "@redis_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

2. Add environment variables in Vercel dashboard
3. Deploy

---

## 📊 Vercel Deployment Comparison

| Feature | Vercel | Google Cloud | AWS |
|---------|--------|--------------|-----|
| Web Console | ✅ Perfect | ✅ Good | ✅ Good |
| Backend API | ⚠️ Limited | ✅ Perfect | ✅ Perfect |
| Database | ❌ No | ✅ Yes | ✅ Yes |
| WebSocket | ⚠️ Limited | ✅ Yes | ✅ Yes |
| Cost | Free | Free tier | Free tier |
| Setup Time | 5 min | 30 min | 45 min |

---

## ✅ Vercel Deployment Checklist

### Before Deployment
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Repository selected
- [ ] Environment variables configured

### During Deployment
- [ ] Project imported
- [ ] Build successful
- [ ] Deployment successful
- [ ] URL generated

### After Deployment
- [ ] Web console loads
- [ ] API calls working
- [ ] No errors in logs
- [ ] Performance acceptable

---

## 🎯 Recommended: Use Vercel + Google Cloud

**Best approach**:
- **Vercel**: Deploy web console (React)
- **Google Cloud**: Deploy backend API (Node.js)

This gives you the best of both worlds!

---

## 📞 Vercel Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Pricing](https://vercel.com/pricing)

---

**Status**: ✅ **READY FOR VERCEL DEPLOYMENT**

**Generated**: May 28, 2026
