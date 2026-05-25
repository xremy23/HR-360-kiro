# Quick Start Guide

## What We've Built

A **Progressive Web App (PWA)** for emergency management that works on any device (mobile, tablet, desktop) with full offline capabilities.

## Current Status

✅ **Backend API** - Running on `http://localhost:3000`
✅ **Web Console** - Running on `http://localhost:5173`
✅ **PWA Ready** - Installable on home screen
✅ **Offline Support** - Works without internet

## How to Run

### Terminal 1: Start Backend
```powershell
cd backend
npm run dev
```
Expected output: `Server running on http://localhost:3000`

### Terminal 2: Start Web Console
```powershell
cd web
npm run dev
```
Expected output: `Local: http://localhost:5173/`

### Terminal 3: (Optional) PostgreSQL
If not already running:
```powershell
# Windows
pg_ctl -D "C:\Program Files\PostgreSQL\18\data" start

# Or use Services app to start PostgreSQL
```

## Access the App

### Desktop
1. Open browser: `http://localhost:5173`
2. Login with:
   - Email: `admin@example.com`
   - Password: `password123`
3. You'll see the full admin console

### Mobile (on same network)
1. Get your computer's IP: `ipconfig` → look for IPv4 Address
2. On mobile browser: `http://<YOUR_IP>:5173`
3. Login with same credentials
4. Admin console is hidden - you'll see employee app only
5. Tap "Install" to add to home screen

## Test Offline Mode

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. App still works! Try:
   - Navigate between pages
   - View cached data
   - Make changes (stored locally)
5. Uncheck "Offline" to sync changes

## What's Working

### Employee App (All Devices)
- ✅ Login/Logout
- ✅ Home dashboard
- ✅ Check In page (placeholder)
- ✅ Knowledge Base (placeholder)
- ✅ Contacts (placeholder)
- ✅ Alerts (placeholder)
- ✅ Settings (placeholder)
- ✅ Offline indicator

### Admin Console (Desktop Only)
- ✅ Dashboard with stats
- ✅ KB Management (placeholder)
- ✅ Organization Management (placeholder)
- ✅ User Management (placeholder)
- ✅ Alert Management (placeholder)
- ✅ Incident Management (placeholder)
- ✅ Drill Management (placeholder)

### PWA Features
- ✅ Service Worker caching
- ✅ IndexedDB local storage
- ✅ Offline sync queue
- ✅ Install prompt
- ✅ Online/offline detection
- ✅ Background sync ready

## Next: Implement Features

The app structure is ready. Next steps:

1. **Check-In Feature**
   - Add location tracking
   - Store check-in status
   - Sync with backend

2. **Knowledge Base**
   - Create KB editor
   - Display guides
   - Search functionality

3. **Alerts System**
   - Create alerts
   - Push notifications
   - Real-time updates

4. **User Management**
   - Add/edit users
   - Assign roles
   - Manage permissions

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Error
```powershell
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Or restart PostgreSQL
pg_ctl -D "C:\Program Files\PostgreSQL\18\data" restart
```

### Service Worker Not Updating
```
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Unregister" under Service Workers
4. Hard refresh (Ctrl+Shift+R)
```

## File Locations

- **Backend**: `backend/src/`
- **Web App**: `web/src/`
- **Database**: PostgreSQL (emergency_app)
- **Config**: `.env` files in backend/ and web/

## Key Files to Know

- `web/src/AppRouter.tsx` - Main routing logic
- `web/src/pages/` - Page components
- `web/src/store/` - Redux state management
- `web/public/service-worker.js` - Offline support
- `backend/src/server.ts` - API server
- `backend/src/config/database.ts` - Database setup

## Questions?

Check these files for more info:
- `PWA_IMPLEMENTATION_COMPLETE.md` - Full technical details
- `ARCHITECTURE.md` - System architecture
- `DEPLOYMENT.md` - Deployment guide
- `docs/API.md` - API documentation
