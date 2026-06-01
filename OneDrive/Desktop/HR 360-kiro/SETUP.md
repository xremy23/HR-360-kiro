# Setup Guide - HR 360 Emergency Management PWA

Complete setup instructions for all platforms.

---

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **PostgreSQL**: 14.0 or higher
- **Redis**: 6.0 or higher
- **Git**: 2.30.0 or higher

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd HR\ 360-kiro
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your settings:
# - DATABASE_URL=postgresql://user:password@localhost:5432/hr360
# - REDIS_URL=redis://localhost:6379
# - JWT_SECRET=your-secret-key
# - EMAIL_USER=your-email@gmail.com
# - EMAIL_PASSWORD=your-app-password
```

### 3. Frontend Setup

```bash
cd ../web

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your settings:
# - VITE_API_URL=http://localhost:3000/api
```

### 4. Database Setup

#### PostgreSQL Installation

**Windows**:
```bash
# Using Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

**macOS**:
```bash
# Using Homebrew
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hr360;

# Create user
CREATE USER hr360_user WITH PASSWORD 'your_password';

# Grant privileges
ALTER ROLE hr360_user SET client_encoding TO 'utf8';
ALTER ROLE hr360_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE hr360_user SET default_transaction_deferrable TO on;
ALTER ROLE hr360_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE hr360 TO hr360_user;

# Exit psql
\q
```

#### Run Migrations

```bash
cd backend

# Run all migrations
npm run migrate:run

# Check migration status
npm run migrate:status
```

### 5. Redis Setup

#### Redis Installation

**Windows**:
```bash
# Using Chocolatey
choco install redis-64

# Or use Windows Subsystem for Linux (WSL)
wsl
sudo apt-get install redis-server
```

**macOS**:
```bash
# Using Homebrew
brew install redis

# Start Redis
brew services start redis
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
```

#### Verify Redis

```bash
# Connect to Redis
redis-cli

# Test connection
ping
# Should return: PONG

# Exit
exit
```

---

## Development

### Start Backend

```bash
cd backend

# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

Backend will be available at `http://localhost:3000`

### Start Frontend

```bash
cd web

# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Frontend will be available at `http://localhost:5173`

---

## Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000
API_PORT=3000

# Database
DATABASE_URL=postgresql://hr360_user:password@localhost:5432/hr360
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr360
DB_USER=hr360_user
DB_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@hr360.com

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
```

### Frontend (.env)

```env
# API
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000

# App
VITE_APP_NAME=HR 360
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true
```

---

## Verification

### Backend Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Backend is running",
  "security": {
    "redisConnected": true,
    "environment": "development"
  }
}
```

### Frontend Build

```bash
cd web
npm run build
```

Expected output:
```
✓ 180 modules transformed
dist/index.html                   1.05 kB
dist/assets/index-*.css          29.97 kB
dist/assets/index-*.js          359.35 kB
✓ built in 3.40s
```

---

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# If connection refused, start PostgreSQL
# Windows: net start postgresql-x64-14
# macOS: brew services start postgresql@14
# Linux: sudo systemctl start postgresql
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# If connection refused, start Redis
# Windows: redis-server
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server
```

### Port Already in Use

```bash
# Find process using port 3000
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000

# Kill process
# Windows: taskkill /PID <PID> /F
# macOS/Linux: kill -9 <PID>
```

### Database Migration Issues

```bash
# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:create
```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- userService.test.ts

# Run with coverage
npm test -- --coverage
```

### Frontend Tests

```bash
cd web

# Run all tests
npm test

# Run specific test file
npm test -- LoginPage.test.tsx

# Run with coverage
npm test -- --coverage
```

---

## Production Deployment

### Google Cloud Run

```bash
# Set up gcloud CLI
gcloud init

# Deploy backend
cd backend
gcloud run deploy hr360-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=$DATABASE_URL,REDIS_URL=$REDIS_URL

# Deploy frontend
cd ../web
gcloud run deploy hr360-web \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Next Steps

1. ✅ Install prerequisites
2. ✅ Clone repository
3. ✅ Set up backend
4. ✅ Set up frontend
5. ✅ Set up database
6. ✅ Set up Redis
7. ⏳ Run migrations
8. ⏳ Start development servers
9. ⏳ Test endpoints
10. ⏳ Begin development

---

**Last Updated**: June 1, 2026

