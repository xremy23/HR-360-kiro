# Development Setup Guide

This guide will help you set up the HR 360 Emergency Management System for local development.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Redis 6+
- Git

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../web
npm install

# Install mobile dependencies (optional)
cd ../mobile
npm install
```

### 2. Database Setup

#### PostgreSQL Installation

**Windows:**
```bash
# Using Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE emergency_app;

# Create user
CREATE USER app_user WITH PASSWORD 'secure_password';

# Grant privileges
ALTER ROLE app_user SET client_encoding TO 'utf8';
ALTER ROLE app_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE app_user SET default_transaction_deferrable TO on;
ALTER ROLE app_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE emergency_app TO app_user;

# Exit psql
\q
```

#### Run Migrations

```bash
cd backend

# Run initial schema migration
npm run migrate:run

# Check migration status
npm run migrate:status
```

### 3. Redis Setup

**Windows:**
```bash
# Using Chocolatey
choco install redis-64

# Or download from https://github.com/microsoftarchive/redis/releases
```

**macOS:**
```bash
# Using Homebrew
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### 4. Environment Configuration

#### Backend Configuration

```bash
cd backend

# Copy example env file
cp .env.example .env

# Edit .env with your configuration
# Important variables:
# - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# - REDIS_HOST, REDIS_PORT
# - JWT_SECRET (generate a random string)
# - EMAIL_USER, EMAIL_PASSWORD (for Gmail, use app-specific password)
```

#### Frontend Configuration

```bash
cd web

# Copy example env file
cp .env.example .env

# Edit .env with your configuration
# VITE_API_URL should point to your backend
```

### 5. Email Configuration (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the generated password
3. Add to `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   ```

### 6. Start Development Servers

#### Terminal 1: Backend

```bash
cd backend
npm run dev

# Server will start on http://localhost:3000
# API available at http://localhost:3000/api
# Health check: http://localhost:3000/health
```

#### Terminal 2: Frontend

```bash
cd web
npm run dev

# Frontend will start on http://localhost:5173
```

#### Terminal 3: Mobile (Optional)

```bash
cd mobile
npm run dev

# Mobile dev server will start on http://localhost:8081
```

## Testing the Setup

### 1. Check Backend Health

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

### 2. Test Magic Link Authentication

```bash
# Send magic link
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check console output for magic link (in development mode)
# Or check your email inbox
```

### 3. Access Frontend

Open http://localhost:5173 in your browser and test the login flow.

## Database Schema

The database schema is automatically created when you run migrations. Key tables include:

- `users` - User accounts
- `organizations` - Organizations/Companies
- `teams` - Teams within organizations
- `departments` - Departments within organizations
- `alerts` - Emergency alerts
- `check_ins` - Team status check-ins
- `incidents` - Incident reports
- `sos_escalations` - SOS emergency signals
- `kb_guides` - Knowledge base articles
- `contacts` - Emergency contacts
- `tobag_items` - To-go bag checklists

See `backend/src/migrations/001_initial_schema.sql` for full schema details.

## Troubleshooting

### PostgreSQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection parameters in `.env`
- Verify database exists: `psql -U postgres -l`

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check Redis configuration in `.env`
- Falls back to in-memory storage if Redis unavailable (development only)

### Email Not Sending

**Solution:**
- Verify Gmail app password is correct
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`
- Enable "Less secure app access" if using regular Gmail password
- Check backend logs for email service errors

### Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

## Development Tips

### Hot Reload

Both backend and frontend support hot reload:
- Backend: Changes to `.ts` files auto-reload
- Frontend: Changes to `.tsx` files auto-reload

### Database Debugging

```bash
# Connect to database
psql -U app_user -d emergency_app

# List tables
\dt

# View table structure
\d users

# Run queries
SELECT * FROM users LIMIT 5;
```

### Redis Debugging

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Get value
GET magic_link:token-here

# Monitor commands
MONITOR
```

### API Testing

Use Postman or curl to test API endpoints:

```bash
# Get auth token
curl -X POST http://localhost:3000/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/profile
```

## Production Deployment

See `DEPLOYMENT.md` for production setup instructions.

## Next Steps

1. Review `START_HERE.md` for project overview
2. Check `PROJECT_RESTART.md` for architecture details
3. Read `IMPLEMENTATION_GUIDE.md` for development guidelines
4. Review `PHASE_1_PROGRESS.md` for current development status

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `backend/logs/`
3. Check browser console for frontend errors
4. Review database logs: PostgreSQL logs

---

**Last Updated:** June 1, 2026
**Version:** 1.0.0
