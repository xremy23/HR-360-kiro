# Google Cloud CLI vs Google Cloud Console

Understanding the difference and when to use each.

---

## Quick Comparison

| Feature | Google Cloud CLI | Google Cloud Console |
|---------|------------------|----------------------|
| **Type** | Command-line tool | Web-based interface |
| **Access** | Terminal/PowerShell | Web browser |
| **Installation** | Required | Not required |
| **Speed** | Fast (scripting) | Slower (clicking) |
| **Automation** | Excellent | Limited |
| **Learning Curve** | Steep | Gentle |
| **Best For** | Automation, scripting | Visual management |
| **Batch Operations** | Easy | Difficult |

---

## Google Cloud CLI (gcloud)

### What It Is
- **Command-line interface** for Google Cloud
- Installed on your computer
- Run commands in terminal/PowerShell
- Scriptable and automatable

### Installation
```bash
# Windows
# Download from: https://cloud.google.com/sdk/docs/install-gcloud-cli
# Run installer

# Mac
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
```

### Common Commands
```bash
# Authentication
gcloud auth login

# Project management
gcloud projects create hr-360-app
gcloud config set project hr-360-app
gcloud projects list

# Service management
gcloud services enable run.googleapis.com
gcloud services list

# Cloud Run
gcloud run deploy hr-360-backend --image gcr.io/...
gcloud run services list
gcloud run logs read hr-360-backend

# Cloud Storage
gsutil mb gs://hr-360-web-app
gsutil ls gs://hr-360-web-app/
gsutil cp file.txt gs://hr-360-web-app/

# IAM
gcloud iam service-accounts create hr-360-sa
gcloud projects add-iam-policy-binding hr-360-app \
  --member=user:admin@example.com \
  --role=roles/editor
```

### Advantages
✅ Fast and efficient
✅ Easy to automate
✅ Scriptable (batch operations)
✅ Great for CI/CD pipelines
✅ Powerful for advanced tasks
✅ Works offline (mostly)
✅ Perfect for developers

### Disadvantages
❌ Steep learning curve
❌ Need to remember commands
❌ No visual feedback
❌ Requires installation
❌ Terminal/PowerShell knowledge needed

### Best For
- Developers
- Automation
- Scripting
- CI/CD pipelines
- Batch operations
- Advanced configurations

---

## Google Cloud Console

### What It Is
- **Web-based interface** for Google Cloud
- Access via browser at https://console.cloud.google.com
- Point-and-click interface
- Visual management

### How to Access
1. Go to https://console.cloud.google.com
2. Sign in with Google account
3. Select project from dropdown
4. Navigate using sidebar menu

### Common Tasks
```
Dashboard
├── Create Project
├── Select Project
├── View Resources
└── Manage Settings

Compute
├── Cloud Run
│   ├── Deploy Service
│   ├── View Logs
│   └── Manage Traffic
└── Compute Engine

Storage
├── Cloud Storage
│   ├── Create Bucket
│   ├── Upload Files
│   └── Set Permissions
└── Databases

Networking
├── Cloud CDN
├── Load Balancing
└── VPC Networks

Monitoring
├── Logs
├── Metrics
└── Alerts

IAM & Admin
├── Users & Permissions
├── Service Accounts
└── Roles
```

### Advantages
✅ Visual interface
✅ Easy to learn
✅ No installation needed
✅ Good for beginners
✅ Real-time visual feedback
✅ Intuitive navigation
✅ Great for one-off tasks

### Disadvantages
❌ Slower for repetitive tasks
❌ Hard to automate
❌ Not scriptable
❌ Requires browser
❌ Limited batch operations
❌ Clicking is tedious for many tasks

### Best For
- Beginners
- One-off tasks
- Visual management
- Monitoring
- Troubleshooting
- Learning

---

## Side-by-Side Examples

### Example 1: Create a Project

**Using CLI:**
```bash
gcloud projects create hr-360-app --name="HR 360"
gcloud config set project hr-360-app
```
**Time**: 10 seconds

**Using Console:**
1. Go to https://console.cloud.google.com
2. Click "Select a project" dropdown
3. Click "New Project"
4. Enter project name
5. Click "Create"
6. Wait for creation
7. Select project from dropdown
**Time**: 2-3 minutes

---

### Example 2: Deploy to Cloud Run

**Using CLI:**
```bash
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
**Time**: 30 seconds (+ image build time)

**Using Console:**
1. Go to Cloud Run
2. Click "Create Service"
3. Select image from registry
4. Enter service name
5. Select region
6. Configure settings
7. Click "Create"
8. Wait for deployment
**Time**: 3-5 minutes

---

### Example 3: Upload Files to Cloud Storage

**Using CLI:**
```bash
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
```
**Time**: 30 seconds

**Using Console:**
1. Go to Cloud Storage
2. Click bucket name
3. Click "Upload files"
4. Select files
5. Wait for upload
6. Repeat for each file/folder
**Time**: 5-10 minutes

---

### Example 4: View Logs

**Using CLI:**
```bash
gcloud run logs read hr-360-backend --limit 50
```
**Time**: 5 seconds

**Using Console:**
1. Go to Cloud Run
2. Click service name
3. Click "Logs" tab
4. Wait for logs to load
5. Scroll through logs
**Time**: 30 seconds

---

## When to Use Each

### Use CLI When:
- ✅ Deploying applications
- ✅ Automating tasks
- ✅ Running scripts
- ✅ Setting up CI/CD
- ✅ Batch operations
- ✅ You're comfortable with terminal
- ✅ You need speed
- ✅ You're a developer

### Use Console When:
- ✅ Learning Google Cloud
- ✅ One-off tasks
- ✅ Monitoring resources
- ✅ Troubleshooting
- ✅ Viewing logs visually
- ✅ You prefer GUI
- ✅ You're not technical
- ✅ You need visual feedback

---

## Recommended Approach

### For HR 360 Deployment

**Use CLI for:**
- Creating projects
- Deploying backend
- Uploading frontend apps
- Configuring services
- Setting up automation

**Use Console for:**
- Monitoring costs
- Viewing logs (optional)
- Checking service status
- Setting up alerts
- Viewing dashboards

### Hybrid Approach (Recommended)
```
1. Use CLI for deployment (fast, scriptable)
2. Use Console for monitoring (visual, easy)
3. Use CLI for troubleshooting (logs, debugging)
4. Use Console for cost analysis (visual charts)
```

---

## CLI Installation & Setup

### Step 1: Install Google Cloud CLI

**Windows:**
1. Download: https://cloud.google.com/sdk/docs/install-gcloud-cli
2. Run installer
3. Follow setup wizard
4. Restart terminal

**Mac:**
```bash
brew install --cask google-cloud-sdk
gcloud init
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Step 2: Authenticate
```bash
gcloud auth login
```
- Browser opens
- Sign in with Google account
- Click "Allow"
- Return to terminal

### Step 3: Set Default Project
```bash
gcloud config set project hr-360-app
```

### Step 4: Verify Installation
```bash
gcloud --version
gcloud config list
```

---

## Console Navigation

### Access Console
1. Go to https://console.cloud.google.com
2. Sign in with Google account
3. You're in the console

### Main Sections
- **Dashboard**: Overview of resources
- **Compute**: Cloud Run, Compute Engine, etc.
- **Storage**: Cloud Storage, Databases, etc.
- **Networking**: CDN, Load Balancing, etc.
- **Monitoring**: Logs, Metrics, Alerts
- **IAM & Admin**: Users, Permissions, Roles

### Project Selector
- Top left corner
- Click to switch projects
- Create new projects
- View all projects

### Search
- Top search bar
- Search for services
- Search for resources
- Quick navigation

---

## Common Tasks Comparison

### Task: Deploy Backend

**CLI:**
```bash
docker build -t gcr.io/hr-360-app/backend:latest backend/
docker push gcr.io/hr-360-app/backend:latest
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Console:**
1. Go to Cloud Run
2. Click "Create Service"
3. Select image
4. Configure settings
5. Click "Create"

---

### Task: View Logs

**CLI:**
```bash
gcloud run logs read hr-360-backend --limit 50
gcloud run logs read hr-360-backend --follow  # Real-time
```

**Console:**
1. Go to Cloud Run
2. Click service name
3. Click "Logs" tab
4. View logs in real-time

---

### Task: Check Costs

**CLI:**
```bash
gcloud billing accounts list
gcloud billing projects list --billing-account=ACCOUNT_ID
```

**Console:**
1. Go to Billing
2. View costs by service
3. View charts and graphs
4. Set budgets and alerts

---

## Scripting with CLI

### Example: Automated Deployment Script

```bash
#!/bin/bash

# Set project
gcloud config set project hr-360-app

# Build and push Docker image
docker build -t gcr.io/hr-360-app/backend:latest backend/
docker push gcr.io/hr-360-app/backend:latest

# Deploy to Cloud Run
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build frontend apps
cd web && npm run build && cd ..
cd mobile && npm run build && cd ..

# Upload to Cloud Storage
gsutil -m cp -r web/dist/* gs://hr-360-web-app/
gsutil -m cp -r mobile/dist/* gs://hr-360-mobile-app/

# Get backend URL
BACKEND_URL=$(gcloud run services describe hr-360-backend \
  --region us-central1 \
  --format='value(status.url)')

echo "Deployment complete!"
echo "Backend URL: $BACKEND_URL"
```

**Run with:**
```bash
bash deploy.sh
```

---

## Learning Path

### For Beginners
1. Start with Console (visual, easy)
2. Learn basic concepts
3. Gradually move to CLI
4. Use CLI for deployment
5. Use Console for monitoring

### For Developers
1. Start with CLI (faster)
2. Learn commands
3. Create scripts
4. Use Console for monitoring
5. Automate everything

---

## Summary

| Aspect | CLI | Console |
|--------|-----|---------|
| **Speed** | Fast | Slow |
| **Automation** | Excellent | Limited |
| **Learning** | Steep | Gentle |
| **Scripting** | Yes | No |
| **Visual** | No | Yes |
| **Installation** | Required | Not needed |
| **Best For** | Developers | Beginners |

---

## For HR 360 Deployment

**Recommended**: Use CLI for deployment, Console for monitoring

**CLI Commands You'll Need:**
```bash
gcloud projects create
gcloud config set project
gcloud services enable
gcloud run deploy
gcloud run logs read
gsutil mb
gsutil web set
gsutil iam ch
gsutil cp
```

**Console Tasks You'll Need:**
- View billing
- Check service status
- View logs (optional)
- Set up alerts
- Monitor costs

---

## Quick Decision

**Choose CLI if:**
- You're comfortable with terminal
- You want to automate
- You're deploying applications
- You want speed

**Choose Console if:**
- You're learning
- You prefer visual interface
- You're doing one-off tasks
- You want to see what's happening

**Best Practice**: Use both!
- CLI for deployment and automation
- Console for monitoring and management
