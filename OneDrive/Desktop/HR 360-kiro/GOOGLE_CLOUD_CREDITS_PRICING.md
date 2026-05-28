# Google Cloud Credits & Pricing Guide

How Google Cloud credits are calculated and what you'll pay for HR 360.

## Google Cloud Credits Overview

### Free Trial Credits
- **New customers**: $300 in free credits (valid for 90 days)
- **No credit card required** to start
- Credits apply to all Google Cloud services
- After credits expire or are used, you pay standard rates

### How Credits Work
1. Credits are applied **automatically** to your bill
2. Credits cover the **full cost** of services (not a discount)
3. When credits run out, you pay standard rates
4. Unused credits expire after the trial period

---

## HR 360 Pricing Breakdown

### Cloud Run (Backend API)

**Free Tier (Monthly)**
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds of compute

**Paid Tier (Beyond Free)**
- **Requests**: $0.40 per million requests
- **Memory**: $0.0000250 per GB-second
- **CPU**: $0.0000100 per vCPU-second
- **Minimum charge**: Rounded to nearest 100ms

**Example: 10 million requests/month**
```
Free tier: 2 million requests = $0
Paid tier: 8 million requests × $0.40 = $3.20/month
```

**Example: 100 million requests/month**
```
Free tier: 2 million requests = $0
Paid tier: 98 million requests × $0.40 = $39.20/month
```

### Cloud Storage (Frontend Apps)

**Storage Costs**
- **Standard storage**: $0.020 per GB/month
- **Retrieval**: $0.0004 per 1,000 operations (Class B)
- **Upload**: $0.0050 per 1,000 operations (Class A)

**Example: 500 MB web app + 500 MB mobile app**
```
Storage: 1 GB × $0.020 = $0.02/month
Operations: ~1,000 operations × $0.0004 = $0.0004/month
Total: ~$0.02/month
```

**Example: 1 GB web app + 1 GB mobile app**
```
Storage: 2 GB × $0.020 = $0.04/month
Operations: ~2,000 operations × $0.0004 = $0.0008/month
Total: ~$0.04/month
```

### Cloud CDN (Optional)

**CDN Costs**
- **Cache egress**: $0.12 per GB (first 1TB/month)
- **Cache fill**: $0.01 per GB
- **Minimum charge**: $0.01/month

**Example: 10 GB/month through CDN**
```
Cache egress: 10 GB × $0.12 = $1.20/month
Cache fill: 10 GB × $0.01 = $0.10/month
Total: ~$1.30/month
```

### Data Transfer

**Egress Pricing** (data leaving Google Cloud)
- **To Americas/EMEA**: $0.12 per GB
- **To Asia**: $0.12 per GB
- **Between regions**: $0.01 per GB
- **Within same region**: FREE

**Ingress Pricing** (data entering Google Cloud)
- **Always FREE**

**Example: 100 GB/month egress to users**
```
Egress: 100 GB × $0.12 = $12/month
```

---

## Total Monthly Cost Estimates

### Scenario 1: Low Traffic (Startup)
- 5 million API requests/month
- 500 MB storage
- No CDN
- 10 GB egress

```
Cloud Run:     (5M - 2M) × $0.40 = $1.20
Storage:       1 GB × $0.020 = $0.02
Data transfer: 10 GB × $0.12 = $1.20
─────────────────────────────────
Total:         ~$2.42/month
```

**With $300 credits**: Covers ~124 months (10+ years)

### Scenario 2: Medium Traffic (Growing)
- 50 million API requests/month
- 1 GB storage
- Cloud CDN enabled
- 100 GB egress

```
Cloud Run:     (50M - 2M) × $0.40 = $19.20
Storage:       1 GB × $0.020 = $0.02
CDN:           100 GB × $0.12 = $12.00
Data transfer: 100 GB × $0.12 = $12.00
─────────────────────────────────
Total:         ~$43.22/month
```

**With $300 credits**: Covers ~7 months

### Scenario 3: High Traffic (Production)
- 500 million API requests/month
- 2 GB storage
- Cloud CDN enabled
- 500 GB egress

```
Cloud Run:     (500M - 2M) × $0.40 = $199.20
Storage:       2 GB × $0.020 = $0.04
CDN:           500 GB × $0.12 = $60.00
Data transfer: 500 GB × $0.12 = $60.00
─────────────────────────────────
Total:         ~$319.24/month
```

**With $300 credits**: Covers ~1 month

---

## How Credits Are Applied

### Credit Application Order
1. **Free tier limits** are applied first (no credits used)
2. **Remaining usage** is charged at standard rates
3. **Credits** are applied to the total bill
4. **Overage** is charged to your payment method

### Example: $50 bill with $300 credits
```
Total charges:     $50.00
Credits available: $300.00
Amount due:        $0.00 (covered by credits)
Credits remaining: $250.00
```

### Example: $350 bill with $300 credits
```
Total charges:     $350.00
Credits available: $300.00
Amount due:        $50.00 (paid from card)
Credits remaining: $0.00
```

---

## Monitoring Credit Usage

### View Credit Balance
1. Go to Google Cloud Console
2. Click **Billing** → **Overview**
3. See "Credits" section showing:
   - Total credits
   - Used credits
   - Remaining credits
   - Expiration date

### View Detailed Charges
1. Go to **Billing** → **Reports**
2. Filter by service (Cloud Run, Storage, etc.)
3. See hourly/daily breakdown

### Set Budget Alerts
1. Go to **Billing** → **Budgets and alerts**
2. Create budget (e.g., $50/month)
3. Get email alerts when approaching limit

---

## Cost Optimization Tips

### 1. Use Free Tier Limits
- Cloud Run: 2M requests/month free
- Storage: First 5GB free (with certain conditions)
- Data transfer: 1GB/month free (from North America)

### 2. Optimize Cloud Run
- Use smaller memory (512MB vs 2GB)
- Set max instances to prevent runaway costs
- Use concurrency to handle more requests per instance

### 3. Optimize Storage
- Use Standard storage class (cheapest)
- Delete old versions of files
- Use Cloud CDN to reduce egress costs

### 4. Optimize Data Transfer
- Keep data in same region (free transfer)
- Use Cloud CDN to cache at edge
- Compress responses (gzip)

### 5. Use Committed Use Discounts (CUDs)
- 1-year commitment: ~25% discount
- 3-year commitment: ~52% discount
- Only if you're confident about usage

---

## HR 360 Specific Recommendations

### For Development/Testing
- Use free tier only
- No CDN needed
- Estimated cost: **$0/month** (covered by free tier)

### For Small Production (< 10M requests/month)
- Cloud Run: ~$3/month
- Storage: ~$0.05/month
- No CDN
- Estimated cost: **~$3/month**

### For Medium Production (10-100M requests/month)
- Cloud Run: ~$15-40/month
- Storage: ~$0.05/month
- Cloud CDN: ~$5-15/month
- Estimated cost: **~$20-55/month**

### For Large Production (> 100M requests/month)
- Cloud Run: ~$40+/month
- Storage: ~$0.05/month
- Cloud CDN: ~$15+/month
- Estimated cost: **~$55+/month**

---

## Important Notes

### Credits Don't Cover Everything
- Some services have no free tier
- Some services can't use credits (e.g., certain enterprise features)
- Check service-specific terms

### After Free Trial
- You must add a payment method
- Charges go to your card automatically
- You can set spending limits

### Regional Pricing
- Prices vary by region
- us-central1 is typically cheapest
- us-east1 is slightly more expensive

### Committed Use Discounts
- New model (2026): Direct discounts on pricing
- Old model: Credits applied to bill
- Check which model applies to your services

---

## Billing Examples for HR 360

### Month 1: Development
```
Cloud Run:     0 requests (testing locally)
Storage:       100 MB
Data transfer: 0 GB
─────────────────────────────
Total:         $0.00 (free tier)
Credits used:  $0.00
```

### Month 2: Beta Launch
```
Cloud Run:     5 million requests
Storage:       500 MB
Data transfer: 5 GB
─────────────────────────────
Total:         $1.80
Credits used:  $1.80
Credits left:  $298.20
```

### Month 3: Growing
```
Cloud Run:     20 million requests
Storage:       1 GB
Data transfer: 20 GB
─────────────────────────────
Total:         $9.20
Credits used:  $9.20
Credits left:  $289.00
```

### Month 4: Production
```
Cloud Run:     100 million requests
Storage:       2 GB
Data transfer: 100 GB
CDN:           50 GB
─────────────────────────────
Total:         $52.00
Credits used:  $52.00
Credits left:  $237.00
```

---

## Summary

- **New customers**: $300 free credits for 90 days
- **HR 360 startup cost**: ~$0-5/month (covered by free tier)
- **HR 360 production cost**: ~$20-50/month (typical)
- **Free tier covers**: 2M requests, 360K GB-seconds, 180K vCPU-seconds
- **After free trial**: Add payment method, pay standard rates

**Bottom line**: You can run HR 360 for free for several months with the $300 credit, then pay $20-50/month for typical production usage.
