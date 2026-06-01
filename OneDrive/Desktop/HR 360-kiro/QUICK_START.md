# Quick Start Guide

Get HR 360 running in 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (with database created)
- Redis 6+ (optional, falls back to in-memory)

## Installation

### 1. Clone & Install

```bash
cd HR\ 360-kiro

# Backend
cd backend
npm install

# Frontend (new terminal)
cd ../web
npm install
```

### 2. Configure Database

```bash
# Edit backend/.env with your PostgreSQL credentials
# DO NOT commit this file
cd backend
nano .env  # or use your editor

# Set:
# DB_PASSWORD=your_password
# DB_NAME=hr360
```

### 3. Run Migrations

```bash
cd backend
npm run migrate:run
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Frontend
cd web
npm run dev
# Runs on http://localhost:5173
```

## Verify Setup

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

### Frontend
Open http://localhost:5173 in your browser

## Common Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run migrate:run  # Run database migrations
npm run migrate:status  # Check migration status
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

## Project Structure

```
backend/
├── src/
│   ├── config/      # Database & security config
│   ├── entities/    # Data models
│   ├── middleware/  # Auth, error handling
│   ├── routes/      # API endpoints
│   ├── services/    # Business logic
│   └── migrations/  # Database migrations
└── package.json

web/
├── src/
│   ├── components/  # React components
│   ├── pages/       # Page components
│   ├── services/    # API & PWA services
│   ├── store/       # Redux state
│   └── App.tsx      # Main app
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/send-magic-link` - Send magic link
- `POST /api/auth/verify-magic-link` - Verify magic link
- `GET /api/auth/validate` - Validate token

### Phase 2 Features
- `GET /api/kb/guides` - Knowledge base
- `GET /api/alerts` - Alerts
- `GET /api/check-ins` - Check-ins
- `GET /api/incidents` - Incidents
- `POST /api/sos` - SOS escalation

See [README.md](./README.md) for complete API documentation.

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check `.env` credentials
- Ensure database exists: `CREATE DATABASE hr360;`
- See [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure database
3. ✅ Run migrations
4. ✅ Start development servers
5. ⏳ Test API endpoints
6. ⏳ Build frontend components
7. ⏳ Implement offline support

## Documentation

- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guidelines
- [STATUS.md](./STATUS.md) - Current project status

## Support

For issues:
1. Check the troubleshooting section above
2. Review relevant documentation
3. Check backend logs: `backend/logs/`
4. Check browser console for frontend errors

---

**Last Updated**: June 1, 2026  
**Status**: Phase 2 Development (35% Complete)
