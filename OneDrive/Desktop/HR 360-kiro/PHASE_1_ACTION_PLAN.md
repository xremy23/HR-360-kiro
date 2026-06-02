# Phase 1: Testing & Setup - Action Plan

**Goal**: Test all 4 features, verify everything works, prepare for staging deployment

**Duration**: ~2-3 hours  
**Status**: 🟢 Ready to Begin

---

## Overview

```
Phase 1: Testing & Setup ← YOU ARE HERE
├── Database Setup (5 min)
├── Server Startup (5 min)
├── Feature Testing (20 min)
├── Offline Testing (5 min)
├── Build Verification (5 min)
└── Issues & Fixes (varies)

↓ (After Phase 1)

Phase 2: Staging Deployment
├── Environment config for staging
├── Deploy backend
├── Deploy frontend
└── Final verification

↓ (After Phase 2)

Phase 3: Production Deployment
├── Final tests
├── Production environment setup
├── Deploy to production
└── Monitor live
```

---

## Pre-Flight Checklist

Before starting, verify:

- [ ] PostgreSQL installed or accessible
- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Both projects have dependencies installed
- [ ] Both projects build successfully (`npm run build`)
- [ ] Internet connection (for Google Maps API)

**Command to verify everything:**
```bash
node --version
npm --version
cd backend && npm run build && cd ../web && npm run build
```

---

## Task 1: Database Setup (5 minutes)

**File**: `backend/.env` already configured

**Action Items**:
1. [ ] Open PostgreSQL client (pgAdmin or psql)
2. [ ] Create database `hr360` (if not exists)
3. [ ] Run migrations:
   ```bash
   cd backend
   npm run migrate
   ```
4. [ ] Verify tables created (check `biometric_devices` table exists)

**How to verify:**
```bash
# In PostgreSQL
\c hr360
\dt

# Should show tables like:
# - biometric_devices
# - users
# - notifications
# etc.
```

**If this fails**: See troubleshooting in `SETUP_GUIDE.md`

---

## Task 2: Environment Configuration (2 minutes)

**File**: `web/.env.local` created, needs configuration

**Action Items**:
1. [ ] Verify `web/.env.local` exists
2. [ ] Check `VITE_API_URL=http://localhost:3000/api` is set
3. [ ] For Google Maps (optional, but map won't load without it):
   - Go to https://console.cloud.google.com/
   - Create new project
   - Enable "Maps JavaScript API"
   - Create API key
   - Paste into `VITE_GOOGLE_MAPS_API_KEY=` in `web/.env.local`

**Quick API Setup**:
```bash
# Backend running on port 3000
# Frontend running on port 5173
# API calls proxy through VITE_API_URL
```

**If skipped**: Map won't display, but other features work

---

## Task 3: Start Development Servers (5 minutes)

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Expected Output**:
```
✓ Server running on http://localhost:3000
✓ Database connected
✓ Ready for API calls
```

**Terminal 2 - Frontend** (new terminal):
```bash
cd web
npm run dev
```

**Expected Output**:
```
  ➜  Local:   http://localhost:5173/
  ➜  Press q to quit
```

**Then**: Open http://localhost:5173 in browser

**If error**: See "Troubleshooting Servers" below

---

## Task 4: Feature Testing (20-25 minutes)

### 4.1: Push Notifications Test (5 minutes)

**Location**: Top-right bell icon (🔔)

**Steps**:
1. [ ] See bell icon in header
2. [ ] Click bell icon
3. [ ] Browser asks for notification permission
4. [ ] Click "Allow"
5. [ ] Notification center opens
6. [ ] Shows "No notifications" (or list if any)
7. [ ] Unread count badge visible

**Expected**: ✅ All steps work without errors

**If fails**: Check browser console (F12 → Console tab) for errors

---

### 4.2: Biometric Settings Test (5 minutes)

**Location**: Settings (⚙️) → Scroll down → 🔐 Biometric Authentication

**Steps**:
1. [ ] Settings page loads
2. [ ] Biometric section visible
3. [ ] Device support shown (or warning if not supported)
4. [ ] "Add New Device" button:
   - [ ] Clickable if supported
   - [ ] Disabled if not supported
5. [ ] Click "Add New Device" (if supported):
   - [ ] Enrollment flow modal opens
   - [ ] Can select device type (Fingerprint/Face)
   - [ ] Can enter device name
   - [ ] Device appears in list after

**Expected**: ✅ Settings page loads and button state correct

**If fails**: Check backend biometric endpoints

---

### 4.3: Location Sharing Test (5 minutes)

**Location**: Settings (⚙️) → Scroll down → 🗺️ Location Sharing

**Steps**:
1. [ ] Location page loads
2. [ ] Browser asks for location permission
3. [ ] Click "Allow"
4. [ ] See location coordinates displayed
5. [ ] Click "▶️ Start Tracking"
6. [ ] Status changes to "Actively Tracking"
7. [ ] Coordinates update
8. [ ] Click map section to expand and show map
9. [ ] Toggle "Share with Admins" (should work)
10. [ ] Toggle "Share with Team" (should work)

**Expected**: ✅ All controls work, location displays

**If map fails**: Check Google Maps API key in `web/.env.local`

---

### 4.4: Chatbot Feedback Test (5 minutes)

**Location**: Assistant (💬) in bottom navigation

**Steps**:
1. [ ] Go to Assistant page
2. [ ] Send message to chatbot
3. [ ] Bot responds
4. [ ] Below bot message: see 👍 and 👎 buttons
5. [ ] Click 👍 (helpful):
   - [ ] Button changes appearance
   - [ ] Toast shows "Thanks for feedback!"
6. [ ] Try 👎 (unhelpful):
   - [ ] Modal appears for suggestion
   - [ ] Can type suggestion
   - [ ] Submit button works

**Expected**: ✅ Feedback buttons work, feedback submits

**If fails**: Check console for errors in ChatFeedbackButtons component

---

## Task 5: Offline Testing (5 minutes)

**Steps**:
1. [ ] Open DevTools (F12)
2. [ ] Go to "Network" tab
3. [ ] Find "Throttling" dropdown or enable offline
4. [ ] Click "Offline" checkbox
5. [ ] Try actions:
   - [ ] Send chat message (should queue)
   - [ ] Navigate between pages (should cache)
   - [ ] View notification center (should show cached)
6. [ ] Go back online (uncheck Offline)
7. [ ] Check if data syncs

**Expected**: ✅ App works offline, syncs when online

**If fails**: Check IndexedDB caching implementation

---

## Task 6: Build Verification (5 minutes)

**Test 1: Frontend Build**
```bash
cd web
npm run build
```

**Expected**:
```
✓ 192 modules transformed
✓ built in ~5 seconds
✓ 0 errors
```

**Test 2: Backend Build**
```bash
cd backend
npm run build
```

**Expected**:
```
✓ TypeScript compilation passed
✓ 0 errors
```

**Save result**: Both builds should pass ✅

---

## Task 7: Issue Documentation

**If any tests fail**:

1. [ ] Write exact error message
2. [ ] Screenshot (if UI issue)
3. [ ] Browser console output (F12 → Console)
4. [ ] Backend logs (terminal output)
5. [ ] Steps to reproduce

**Example Issue Format**:
```
Feature: Push Notifications
Issue: Bell icon not showing
Steps: 
  1. Log in
  2. Go to home page
  3. Look for bell icon in header - NOT PRESENT
Error: "notification" is not defined (from console)
Expected: Bell icon should be visible
Browser: Chrome 125
```

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Backend won't start | See "Backend Issues" below |
| Frontend won't start | See "Frontend Issues" below |
| Features not working | Check browser console (F12) |
| API calls fail | Verify backend running on port 3000 |
| Map not showing | Add Google Maps API key |
| Database issues | Run `npm run migrate` in backend |

---

## Backend Issues

### "Port 3000 already in use"
```bash
# On Windows (find and kill process)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# On Mac/Linux
lsof -i :3000
kill -9 <process_id>
```

### "Cannot connect to database"
```bash
# Check PostgreSQL running
# Update backend/.env DB credentials
# Ensure hr360 database exists
# Run: npm run migrate
```

### "Module not found" errors
```bash
cd backend
rm -rf node_modules
npm install
npm run build
```

---

## Frontend Issues

### "Port 5173 in use"
```bash
# Use different port
npm run dev -- --port 5174
```

### "Cannot find module"
```bash
cd web
rm -rf node_modules
npm install
npm run build
```

### "API calls fail / 404 errors"
```bash
# Check backend is running on port 3000
# Verify VITE_API_URL in web/.env.local
# Check browser console for exact errors
```

### "Google Maps not showing"
```bash
# Add API key to web/.env.local
# VITE_GOOGLE_MAPS_API_KEY=your_key_here
# Restart frontend (Ctrl+C, npm run dev)
```

---

## Success Criteria

✅ **All tests pass**:
- [ ] Push notifications working
- [ ] Biometric settings accessible
- [ ] Location sharing functional
- [ ] Chatbot feedback buttons present
- [ ] No console errors
- [ ] Offline mode works
- [ ] Both builds pass

✅ **No critical issues**:
- Features accessible
- No permission errors
- API calls successful
- Pages load quickly

---

## Time Breakdown

| Task | Est. Time | Actual |
|------|-----------|--------|
| Database setup | 5 min | __ |
| Environment config | 2 min | __ |
| Server startup | 5 min | __ |
| Feature testing | 20 min | __ |
| Offline testing | 5 min | __ |
| Build verification | 5 min | __ |
| **Total** | **42 min** | __ |

---

## Next Steps After Phase 1

**If all tests pass** ✅:
1. Document testing results
2. Move to Phase 2: Staging Deployment
3. Deploy to staging environment
4. Get stakeholder approval
5. Proceed to Phase 3: Production

**If tests fail** ❌:
1. Document all issues
2. Prioritize bugs by severity
3. Fix issues
4. Re-test
5. Repeat until all pass

---

## Resources

- **START_DEVELOPMENT.md** - How to start servers
- **QUICK_TEST_CHECKLIST.md** - Detailed testing steps
- **SETUP_GUIDE.md** - Setup instructions
- **DEVELOPMENT_STATUS.md** - Current project status
- Browser DevTools (F12) - Frontend debugging
- Backend terminal - Server logs

---

## Support

If stuck:
1. Check browser console (F12 → Console)
2. Check backend terminal logs
3. Read troubleshooting sections above
4. Check SETUP_GUIDE.md for detailed help
5. Refer to services documentation

---

## Quick Start Commands

Copy/paste to start testing:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (new terminal)
cd web
npm run dev

# Then: Open http://localhost:5173
```

---

**Ready to start? Follow the tasks above in order.** 🚀

**Estimated time to complete Phase 1: 45 minutes - 1 hour**

Let me know when you finish each section!
