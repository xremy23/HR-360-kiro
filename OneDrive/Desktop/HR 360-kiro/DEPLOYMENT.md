# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Docker (optional)
- Expo CLI (for mobile)
- Android SDK / Xcode (for mobile builds)

## Environment Setup

### Backend

Create `.env` file in `backend/`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=emergency_app

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@emergencyapp.com

# API
API_PORT=3000
API_URL=http://localhost:3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:8081

# WebSocket
WS_PORT=3001
```

### Mobile

Create `.env` file in `mobile/`:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development
```

### Web

Create `.env` file in `web/`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

## Local Development

### 1. Database Setup

```bash
# Create database
createdb emergency_app

# Run migrations
cd backend
npm run migrate
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3000`

### 3. Mobile

```bash
cd mobile
npm install
npm start

# For Android
npm run android

# For iOS
npm run ios
```

### 4. Web Console

```bash
cd web
npm install
npm run dev
```

Web console runs on `http://localhost:5173`

## Production Deployment

### Backend Deployment (Docker)

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

Build and deploy:

```bash
# Build
docker build -t emergency-app-backend .

# Run
docker run -d \
  --name emergency-app-backend \
  -p 3000:3000 \
  --env-file .env.production \
  emergency-app-backend
```

### Web Console Deployment

```bash
cd web
npm run build

# Deploy dist/ folder to CDN or web server
# Example: AWS S3 + CloudFront
aws s3 sync dist/ s3://your-bucket/
```

### Mobile Deployment

#### Android

```bash
cd mobile

# Build APK
eas build --platform android --type apk

# Build AAB for Play Store
eas build --platform android --type app-bundle

# Submit to Play Store
eas submit --platform android
```

#### iOS

```bash
cd mobile

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

## Database Migrations

### Create Migration

```bash
cd backend
npm run migrate -- create migration_name
```

### Run Migrations

```bash
npm run migrate
```

### Rollback

```bash
npm run migrate -- rollback
```

## SSL/TLS Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure in backend
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

## Monitoring & Logging

### Backend Logging

```typescript
// Use Winston or similar
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Error Tracking

```bash
# Install Sentry
npm install @sentry/node

# Configure in backend
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### Performance Monitoring

```bash
# Install New Relic or similar
npm install newrelic
```

## Backup Strategy

### Database Backups

```bash
# Daily backup
0 2 * * * pg_dump emergency_app > /backups/emergency_app_$(date +\%Y\%m\%d).sql

# Restore
psql emergency_app < /backups/emergency_app_20240101.sql
```

### File Backups

```bash
# Backup media files
0 3 * * * tar -czf /backups/media_$(date +\%Y\%m\%d).tar.gz /app/media/
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**
   - Use Nginx or AWS ALB
   - Route to multiple backend instances
   - Session affinity for WebSocket

2. **Database**
   - Read replicas for scaling reads
   - Connection pooling (PgBouncer)
   - Sharding if needed

3. **Caching**
   - Redis for session storage
   - Cache KB guides
   - Cache frequently accessed data

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching
- Use CDN for static assets

## Security Hardening

### API Security

```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true
}));
```

### HTTPS Enforcement

```typescript
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

## Health Checks

### Backend Health Endpoint

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
```

### Database Health

```typescript
app.get('/health/db', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});
```

## Rollback Procedure

1. **Identify Issue**
   - Monitor logs and metrics
   - Identify problematic version

2. **Prepare Rollback**
   - Have previous version ready
   - Backup current database
   - Notify team

3. **Execute Rollback**
   - Stop current service
   - Deploy previous version
   - Verify functionality
   - Monitor for issues

4. **Post-Rollback**
   - Investigate root cause
   - Fix issue
   - Plan re-deployment

## Disaster Recovery

### RTO/RPO Targets
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 15 minutes

### Backup Strategy
- Daily full backups
- Hourly incremental backups
- Off-site backup storage
- Regular restore testing

### Failover Procedure
1. Detect failure
2. Activate standby database
3. Update DNS/load balancer
4. Verify functionality
5. Investigate root cause

## Compliance & Audit

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communication
- Implement access controls
- Regular security audits

### Audit Logging
- Log all user actions
- Log all data access
- Log all admin operations
- Retain logs for compliance period

### GDPR Compliance
- Data export functionality
- Data deletion functionality
- Privacy policy
- Consent management

## Maintenance Windows

### Planned Maintenance
- Schedule during low-traffic periods
- Notify users in advance
- Prepare rollback plan
- Have support team ready

### Emergency Maintenance
- Communicate status
- Minimize downtime
- Document changes
- Post-incident review

## Checklist

- [ ] Environment variables configured
- [ ] Database initialized
- [ ] SSL certificates installed
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Health checks working
- [ ] Load balancer configured
- [ ] CDN configured
- [ ] DNS configured
- [ ] Security hardened
- [ ] Performance tested
- [ ] Disaster recovery tested
- [ ] Team trained
- [ ] Documentation updated
