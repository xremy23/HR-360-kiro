# How to Start Development Servers

## Prerequisites

Before starting, ensure:
- [ ] PostgreSQL is installed and running
- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Dependencies installed: `npm install` in both `backend/` and `web/`

---

## Quick Start (3 steps)

### Step 1: Start Backend

```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3000
✓ Express server started
✓ Database connected
```

**Port**: http://localhost:3000  
**API Base**: http://localhost:3000/api

Keep this terminal open!

---

### Step 2: Start Frontend (New Terminal)

```bash
cd web
npm run dev
```

**Expected Output:**
```
  VITE v5.4.21  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press q to quit
```

**Port**: http://localhost:5173

Keep this terminal open!

---

### Step 3: Open Browser

```
http://localhost:5173
```

You should see the HR 360 login page.

---

## Login

Default test account (if exists):
```
Email: test@example.com
Password: Test123!
```

Or check backend logs for created test user.

---

## Available Commands

### Backend
```bash
cd backend

# Development mode (auto-reload)
npm run dev

# Build for production
npm run build

# Run compiled code
npm start

# Run tests
npm test

# Run migrations
npm run migrate

# Lint code
npm run lint
```

### Frontend
```bash
cd web

# Development mode (auto-reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint
```

---

## Development Workflow

### 1. Make Changes
- Edit `.ts` or `.tsx` files
- Changes auto-reload in browser
- Backend auto-restarts on file changes

### 2. Check Console
- **Backend**: Terminal where `npm run dev` is running
- **Frontend**: Browser DevTools (F12 → Console tab)

### 3. View Logs
- **Backend**: All API calls logged in terminal
- **Frontend**: Console shows app logs

### 4. Test Features
Follow `QUICK_TEST_CHECKLIST.md` to test each feature

---

## Stopping Servers

Press `Ctrl+C` in each terminal to stop:
- Backend terminal: `npm run dev` process stops
- Frontend terminal: Vite dev server stops

---

## Troubleshooting

### Backend Won't Start

**Error: "Port 3000 already in use"**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process_id> /F
```

**Error: "Cannot connect to database"**
- Check PostgreSQL is running
- Verify DB credentials in `backend/.env`
- Ensure `hr360` database exists

**Error: "Module not found"**
```bash
cd backend
npm install
```

### Frontend Won't Start

**Error: "Port 5173 in use"**
```bash
# Use different port
npm run dev -- --port 5174
```

**Error: "Cannot find module"**
```bash
cd web
npm install
```

**Error: "API calls fail"**
- Check backend is running on port 3000
- Verify `VITE_API_URL` in `web/.env.local`

---

## Testing Features

Once both servers are running:

1. **Notifications**: Click bell icon (🔔) in header
2. **Biometric**: Settings → Biometric Authentication
3. **Location**: Settings → Location Sharing  
4. **Feedback**: Assistant → Send message, click feedback buttons

See `QUICK_TEST_CHECKLIST.md` for detailed testing steps.

---

## Environment Variables

### Backend (`backend/.env`)
```
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=j3r3my
DB_NAME=hr360
```

### Frontend (`web/.env.local`)
```
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## File Watching & Auto-Reload

Both servers watch for file changes:

### Backend
- Changes to `backend/src/**/*.ts`
- Auto-restarts server
- **No need to rebuild**

### Frontend  
- Changes to `web/src/**/*.tsx` or `web/src/**/*.ts`
- Auto-reloads in browser (HMR)
- **No need to rebuild**

---

## Performance Tips

- Keep both terminals open side-by-side
- Use browser DevTools for debugging
- Check backend logs for API errors
- Use browser console for frontend errors

---

## Next Steps

1. ✅ Start backend: `npm run dev` (from `backend/`)
2. ✅ Start frontend: `npm run dev` (from `web/`)
3. ✅ Open http://localhost:5173
4. ✅ Log in with test account
5. ✅ Follow `QUICK_TEST_CHECKLIST.md`

---

## Useful Shortcuts

**Browser DevTools**: `F12`  
**Reload Page**: `Ctrl+R` (hard reload: `Ctrl+Shift+R`)  
**Stop Terminal**: `Ctrl+C`  
**New Terminal Tab**: `Ctrl+Shift+T`

---

**You're all set! Start with Step 1 above.** 🚀
