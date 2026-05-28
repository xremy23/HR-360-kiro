# Google Cloud Organization & Parent Project Setup

Advanced setup for enterprise deployments with multiple projects and teams.

---

## PART 1: ORGANIZATION STRUCTURE (Optional)

### When to Use Organization Structure
- Multiple teams/departments
- Multiple environments (dev, staging, production)
- Multiple applications
- Centralized billing
- Shared resources

### Step 1.1: Create Organization (Enterprise Only)
**Note**: Requires Google Workspace or Cloud Identity

1. Go to https://console.cloud.google.com
2. Click **Select a project** → **Create Organization**
3. Follow setup wizard
4. Verify domain ownership

### Step 1.2: Create Folder Structure
```
Organization (hr-360-org)
├── Folder: Production
│   ├── Project: hr-360-prod
│   ├── Project: hr-360-prod-db
│   └── Project: hr-360-prod-monitoring
├── Folder: Staging
│   ├── Project: hr-360-staging
│   └── Project: hr-360-staging-db
├── Folder: Development
│   ├── Project: hr-360-dev
│   └── Project: hr-360-dev-db
└── Folder: Shared
    ├── Project: hr-360-shared-resources
    └── Project: hr-360-billing
```

### Step 1.3: Create Folders via CLI
```bash
# Create production folder
gcloud resource-manager folders create \
  --display-name="Production" \
  --organization=ORGANIZATION_ID

# Create staging folder
gcloud resource-manager folders create \
  --display-name="Staging" \
  --organization=ORGANIZATION_ID

# Create development folder
gcloud resource-manager folders create \
  --display-name="Development" \
  --organization=ORGANIZATION_ID
```

---

## PART 2: PARENT PROJECT SETUP

### Step 2.1: Create Parent Project
```bash
gcloud projects create hr-360-parent \
  --name="HR 360 Parent Project" \
  --organization=ORGANIZATION_ID \
  --folder=FOLDER_ID
```

### Step 2.2: Set as Default
```bash
gcloud config set project hr-360-parent
```

### Step 2.3: Enable Parent APIs
```bash
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com \
  billing.googleapis.com \
  iam.googleapis.com
```

---

## PART 3: MULTI-ENVIRONMENT SETUP

### Step 3.1: Create Production Project
```bash
gcloud projects create hr-360-prod \
  --name="HR 360 Production" \
  --organization=ORGANIZATION_ID \
  --folder=PRODUCTION_FOLDER_ID
```

### Step 3.2: Create Staging Project
```bash
gcloud projects create hr-360-staging \
  --name="HR 360 Staging" \
  --organization=ORGANIZATION_ID \
  --folder=STAGING_FOLDER_ID
```

### Step 3.3: Create Development Project
```bash
gcloud projects create hr-360-dev \
  --name="HR 360 Development" \
  --organization=ORGANIZATION_ID \
  --folder=DEVELOPMENT_FOLDER_ID
```

### Step 3.4: Enable APIs in Each Project
```bash
# For each project
gcloud config set project hr-360-prod
gcloud services enable run.googleapis.com storage-api.googleapis.com

gcloud config set project hr-360-staging
gcloud services enable run.googleapis.com storage-api.googleapis.com

gcloud config set project hr-360-dev
gcloud services enable run.googleapis.com storage-api.googleapis.com
```

---

## PART 4: SHARED RESOURCES PROJECT

### Step 4.1: Create Shared Resources Project
```bash
gcloud projects create hr-360-shared \
  --name="HR 360 Shared Resources" \
  --organization=ORGANIZATION_ID \
  --folder=SHARED_FOLDER_ID
```

### Step 4.2: Enable Shared APIs
```bash
gcloud config set project hr-360-shared
gcloud services enable \
  container-registry.googleapis.com \
  artifactregistry.googleapis.com \
  storage-api.googleapis.com
```

### Step 4.3: Create Shared Container Registry
```bash
# Create artifact registry for Docker images
gcloud artifacts repositories create hr-360-docker \
  --repository-format=docker \
  --location=us-central1 \
  --description="HR 360 Docker Images"
```

### Step 4.4: Create Shared Storage Buckets
```bash
# Shared backups
gsutil mb -l us-central1 gs://hr-360-shared-backups

# Shared logs
gsutil mb -l us-central1 gs://hr-360-shared-logs

# Shared assets
gsutil mb -l us-central1 gs://hr-360-shared-assets
```

---

## PART 5: BILLING SETUP

### Step 5.1: Link Billing Account
```bash
# List billing accounts
gcloud billing accounts list

# Link to parent project
gcloud billing projects link hr-360-parent \
  --billing-account=BILLING_ACCOUNT_ID
```

### Step 5.2: Set Up Billing Budget
```bash
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="HR 360 Monthly Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Step 5.3: Enable Cost Monitoring
1. Go to https://console.cloud.google.com/billing
2. Click **Budgets and alerts**
3. Create budget for each project
4. Set alert thresholds

---

## PART 6: IAM & ACCESS CONTROL

### Step 6.1: Create Service Accounts
```bash
# For production
gcloud iam service-accounts create hr-360-prod-sa \
  --display-name="HR 360 Production Service Account" \
  --project=hr-360-prod

# For staging
gcloud iam service-accounts create hr-360-staging-sa \
  --display-name="HR 360 Staging Service Account" \
  --project=hr-360-staging

# For development
gcloud iam service-accounts create hr-360-dev-sa \
  --display-name="HR 360 Development Service Account" \
  --project=hr-360-dev
```

### Step 6.2: Grant Roles to Service Accounts
```bash
# Production
gcloud projects add-iam-policy-binding hr-360-prod \
  --member=serviceAccount:hr-360-prod-sa@hr-360-prod.iam.gserviceaccount.com \
  --role=roles/run.admin

# Staging
gcloud projects add-iam-policy-binding hr-360-staging \
  --member=serviceAccount:hr-360-staging-sa@hr-360-staging.iam.gserviceaccount.com \
  --role=roles/run.admin

# Development
gcloud projects add-iam-policy-binding hr-360-dev \
  --member=serviceAccount:hr-360-dev-sa@hr-360-dev.iam.gserviceaccount.com \
  --role=roles/run.admin
```

### Step 6.3: Create Team Roles
```bash
# Admin role
gcloud iam roles create hr360Admin \
  --project=hr-360-parent \
  --title="HR 360 Admin" \
  --description="Full access to HR 360 resources" \
  --permissions=run.services.get,run.services.list,storage.buckets.get

# Developer role
gcloud iam roles create hr360Developer \
  --project=hr-360-parent \
  --title="HR 360 Developer" \
  --description="Developer access to HR 360 resources" \
  --permissions=run.services.get,storage.buckets.get

# Viewer role
gcloud iam roles create hr360Viewer \
  --project=hr-360-parent \
  --title="HR 360 Viewer" \
  --description="Read-only access to HR 360 resources" \
  --permissions=run.services.get,storage.buckets.get
```

### Step 6.4: Add Team Members
```bash
# Add admin
gcloud projects add-iam-policy-binding hr-360-prod \
  --member=user:admin@example.com \
  --role=roles/editor

# Add developer
gcloud projects add-iam-policy-binding hr-360-dev \
  --member=user:developer@example.com \
  --role=roles/viewer

# Add viewer
gcloud projects add-iam-policy-binding hr-360-prod \
  --member=user:viewer@example.com \
  --role=roles/viewer
```

---

## PART 7: DEPLOYMENT PIPELINE SETUP

### Step 7.1: Create CI/CD Service Account
```bash
gcloud iam service-accounts create hr-360-cicd \
  --display-name="HR 360 CI/CD Service Account" \
  --project=hr-360-parent
```

### Step 7.2: Grant CI/CD Permissions
```bash
# Grant Cloud Run admin
gcloud projects add-iam-policy-binding hr-360-prod \
  --member=serviceAccount:hr-360-cicd@hr-360-parent.iam.gserviceaccount.com \
  --role=roles/run.admin

# Grant Storage admin
gcloud projects add-iam-policy-binding hr-360-prod \
  --member=serviceAccount:hr-360-cicd@hr-360-parent.iam.gserviceaccount.com \
  --role=roles/storage.admin
```

### Step 7.3: Create Service Account Key
```bash
gcloud iam service-accounts keys create ~/hr-360-cicd-key.json \
  --iam-account=hr-360-cicd@hr-360-parent.iam.gserviceaccount.com
```

**Save this key securely** - you'll need it for GitHub Actions

---

## PART 8: MONITORING & LOGGING

### Step 8.1: Create Logging Sink
```bash
# Send all logs to shared bucket
gcloud logging sinks create hr-360-logs \
  gs://hr-360-shared-logs \
  --log-filter='resource.type="cloud_run_revision"'
```

### Step 8.2: Create Monitoring Dashboard
```bash
gcloud monitoring dashboards create --config-from-file=monitoring-config.yaml
```

### Step 8.3: Set Up Alerts
```bash
# Alert on high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="HR 360 High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5
```

---

## PART 9: DEPLOYMENT ACROSS ENVIRONMENTS

### Step 9.1: Deploy to Development
```bash
gcloud config set project hr-360-dev

# Build and push
docker build -t gcr.io/hr-360-dev/backend:latest backend/
docker push gcr.io/hr-360-dev/backend:latest

# Deploy
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-dev/backend:latest \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 9.2: Deploy to Staging
```bash
gcloud config set project hr-360-staging

# Build and push
docker build -t gcr.io/hr-360-staging/backend:latest backend/
docker push gcr.io/hr-360-staging/backend:latest

# Deploy
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-staging/backend:latest \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 9.3: Deploy to Production
```bash
gcloud config set project hr-360-prod

# Build and push
docker build -t gcr.io/hr-360-prod/backend:latest backend/
docker push gcr.io/hr-360-prod/backend:latest

# Deploy
gcloud run deploy hr-360-backend \
  --image gcr.io/hr-360-prod/backend:latest \
  --region us-central1 \
  --allow-unauthenticated
```

---

## PART 10: BACKUP & DISASTER RECOVERY

### Step 10.1: Create Backup Buckets
```bash
# Daily backups
gsutil mb -l us-central1 gs://hr-360-prod-backups-daily

# Weekly backups
gsutil mb -l us-central1 gs://hr-360-prod-backups-weekly

# Monthly backups
gsutil mb -l us-central1 gs://hr-360-prod-backups-monthly
```

### Step 10.2: Set Up Backup Schedule
```bash
# Create Cloud Scheduler job for daily backups
gcloud scheduler jobs create app-engine hr-360-backup-daily \
  --schedule="0 2 * * *" \
  --http-method=POST \
  --uri=https://hr-360-backend-xxxxx.run.app/api/backup \
  --oidc-service-account-email=hr-360-prod-sa@hr-360-prod.iam.gserviceaccount.com
```

### Step 10.3: Enable Versioning on Buckets
```bash
gsutil versioning set on gs://hr-360-prod-backups-daily
gsutil versioning set on gs://hr-360-prod-backups-weekly
gsutil versioning set on gs://hr-360-prod-backups-monthly
```

---

## PART 11: SECURITY BEST PRACTICES

### Step 11.1: Enable VPC Service Controls
```bash
# Create VPC perimeter
gcloud access-context-manager perimeters create hr-360-perimeter \
  --resources=projects/hr-360-prod \
  --restricted-services=run.googleapis.com,storage.googleapis.com
```

### Step 11.2: Enable Cloud Armor
```bash
# Create security policy
gcloud compute security-policies create hr-360-policy \
  --description="HR 360 Security Policy"

# Add rate limiting rule
gcloud compute security-policies rules create 100 \
  --security-policy=hr-360-policy \
  --action=rate-based-ban \
  --rate-limit-options-enforce-on-key=IP \
  --rate-limit-options-ban-duration-sec=600 \
  --rate-limit-options-conform-action=allow \
  --rate-limit-options-exceed-action=deny-429 \
  --rate-limit-options-rate-limit-threshold-count=100 \
  --rate-limit-options-rate-limit-threshold-interval-sec=60
```

### Step 11.3: Enable Binary Authorization
```bash
# Create attestor
gcloud container binauthz attestors create hr-360-attestor \
  --attestation-authority-note=hr-360-note \
  --attestation-authority-note-project=hr-360-prod
```

---

## PART 12: COST OPTIMIZATION

### Step 12.1: Set Up Committed Use Discounts
```bash
# 1-year commitment for Cloud Run
gcloud compute commitments create hr-360-cud-1yr \
  --plan=ONE_YEAR \
  --resources=vcpu:4,memory:16 \
  --region=us-central1
```

### Step 12.2: Enable Auto-Scaling Limits
```bash
# Limit max instances to prevent runaway costs
gcloud run services update hr-360-backend \
  --max-instances=10 \
  --region=us-central1
```

### Step 12.3: Set Up Cost Anomaly Detection
1. Go to https://console.cloud.google.com/billing
2. Click **Anomaly detection**
3. Enable anomaly detection
4. Set notification email

---

## PART 13: ORGANIZATION CHECKLIST

### Project Structure
- [ ] Organization created (if applicable)
- [ ] Folder structure created
- [ ] Parent project created
- [ ] Production project created
- [ ] Staging project created
- [ ] Development project created
- [ ] Shared resources project created

### Billing
- [ ] Billing account linked
- [ ] Budget created
- [ ] Alert thresholds set
- [ ] Cost monitoring enabled

### IAM & Access
- [ ] Service accounts created
- [ ] Roles assigned
- [ ] Team members added
- [ ] CI/CD service account created
- [ ] Service account keys generated

### Deployment
- [ ] Container registry set up
- [ ] Deployment pipeline configured
- [ ] Development deployment working
- [ ] Staging deployment working
- [ ] Production deployment working

### Monitoring & Logging
- [ ] Logging sink created
- [ ] Monitoring dashboard created
- [ ] Alerts configured
- [ ] Log retention set

### Security & Backup
- [ ] VPC Service Controls enabled
- [ ] Cloud Armor configured
- [ ] Backup buckets created
- [ ] Backup schedule configured
- [ ] Versioning enabled

---

## QUICK REFERENCE

### List All Projects
```bash
gcloud projects list
```

### Switch Projects
```bash
gcloud config set project PROJECT_ID
```

### View Project Details
```bash
gcloud projects describe PROJECT_ID
```

### List Service Accounts
```bash
gcloud iam service-accounts list --project=PROJECT_ID
```

### View IAM Bindings
```bash
gcloud projects get-iam-policy PROJECT_ID
```

### View Billing
```bash
gcloud billing accounts list
gcloud billing projects list --billing-account=BILLING_ACCOUNT_ID
```

---

## ENTERPRISE DEPLOYMENT ARCHITECTURE

```
Organization (hr-360-org)
│
├── Billing Account
│   └── Budget: $1000/month
│
├── Folder: Production
│   ├── Project: hr-360-prod
│   │   ├── Cloud Run: hr-360-backend
│   │   ├── Cloud Storage: hr-360-web-app, hr-360-mobile-app
│   │   └── Cloud SQL: hr-360-db
│   │
│   └── Project: hr-360-prod-monitoring
│       ├── Cloud Logging
│       ├── Cloud Monitoring
│       └── Cloud Trace
│
├── Folder: Staging
│   ├── Project: hr-360-staging
│   │   ├── Cloud Run: hr-360-backend
│   │   ├── Cloud Storage: hr-360-web-app, hr-360-mobile-app
│   │   └── Cloud SQL: hr-360-db
│   │
│   └── Project: hr-360-staging-monitoring
│
├── Folder: Development
│   ├── Project: hr-360-dev
│   │   ├── Cloud Run: hr-360-backend
│   │   ├── Cloud Storage: hr-360-web-app, hr-360-mobile-app
│   │   └── Cloud SQL: hr-360-db
│   │
│   └── Project: hr-360-dev-monitoring
│
└── Folder: Shared
    ├── Project: hr-360-shared
    │   ├── Artifact Registry: Docker images
    │   ├── Cloud Storage: Backups, Logs, Assets
    │   └── Cloud KMS: Encryption keys
    │
    └── Project: hr-360-billing
        ├── Billing Dashboard
        ├── Cost Analysis
        └── Budget Alerts
```

---

## NEXT STEPS

1. ✅ Set up organization structure
2. ✅ Create parent and child projects
3. ✅ Configure IAM and access control
4. ✅ Set up billing and budgets
5. ⏭️ Deploy to development
6. ⏭️ Deploy to staging
7. ⏭️ Deploy to production
8. ⏭️ Configure monitoring and logging
9. ⏭️ Set up backup and disaster recovery
10. ⏭️ Implement security best practices

---

**Estimated Setup Time: 2-3 hours**
**Complexity: Advanced**
