# Quick Test Checklist - Feature Enhancements

## Prerequisites ✅

- [ ] PostgreSQL running (check: can connect to `hr360` database)
- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Dependencies installed (`npm install` in both backend and web)

---

## Step 1: Database Setup (5 minutes)

### Option A: PostgreSQL GUI (pgAdmin)
1. Open pgAdmin or your PostgreSQL client
2. Connect to `PostgreSQL` server with username `postgres`
3. Create database `hr360` (if not exists)
4. Run migrations:
   ```bash
   cd backend
   npm run migrate
   ```

### Option B: Command Line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hr360;

# Exit
\q

# Run migrations
cd backend
npm run migrate
```

**Verify**: Check that table `biometric_devices` exists (created by migration 003)

---

## Step 2: Backend Startup (2 minutes)

```bash
cd backend
npm run dev
```

**Expected Output**:
```
✓ Server running on http://localhost:3000
✓ Database connected
✓ Redis connected (or warning if offline)
```

**If error**: 
- Check PostgreSQL is running
- Check DB credentials in `.env`
- Check port 3000 is free

---

## Step 3: Frontend Startup (2 minutes)

```bash
cd web
npm run dev
```

**Expected Output**:
```
✓ Local: http://localhost:5173/
✓ Press enter to open in browser
```

---

## Step 4: Manual Feature Testing (15-20 minutes)

### Test 1: Push Notifications ✅

**Steps**:
1. Go to http://localhost:5173
2. Log in with test account
3. Look for bell icon 🔔 in top-right header
4. Click bell icon
5. Browser asks for notification permission
6. Click "Allow"
7. Notification center modal appears

**Expected Behavior**:
- [ ] Bell icon visible in header
- [ ] Click shows permission modal
- [ ] Permission accepted
- [ ] Notification center displays
- [ ] Shows "No notifications" (or any notifications)
- [ ] Unread badge shows correctly

**If error**:
- Check console for errors
- Verify Redux is loading notification slice
- Check apiService has `/notifications/preferences` endpoint

---

### Test 2: Biometric Settings ✅

**Steps**:
1. Click bottom navigation ⚙️ (Settings)
2. Scroll down to "Privacy & Permissions"
3. Click "🔐 Biometric Authentication"
4. Check if "Add Device" button is active or disabled
5. If active (device supports biometric):
   - Click "Add New Device"
   - Select biometric type (Fingerprint/Face)
   - Enter device name
   - Complete enrollment

**Expected Behavior**:
- [ ] Settings page loads
- [ ] Button shows device support status
- [ ] If supported: Can start enrollment
- [ ] If not supported: Shows warning message
- [ ] Enrolled devices display in list
- [ ] Can remove devices

**If error**:
- Check biometric endpoints in backend
- Verify biometricService is working
- Check Redux biometricSlice

---

### Test 3: Location Sharing ✅

**Steps**:
1. Click bottom navigation ⚙️ (Settings)
2. Scroll down to "Privacy & Permissions"
3. Click "🗺️ Location Sharing"
4. Browser asks for location permission
5. Click "Allow"
6. Click "▶️ Start Tracking"
7. Wait for location to update
8. Click map section to expand

**Expected Behavior**:
- [ ] Location page loads
- [ ] Location permission requested
- [ ] Current location displays
- [ ] Start/Stop buttons work
- [ ] Map displays with markers
- [ ] Coordinates and accuracy show
- [ ] Sharing preferences toggle

**If error**:
- Check geolocation permission
- Verify Google Maps API key set
- Check location endpoints in backend
- Check Redux locationSlice

---

### Test 4: Chatbot Feedback ✅

**Steps**:
1. Click bottom navigation 💬 (Assistant)
2. Send a message to chatbot
3. Bot responds
4. Below bot message: see 👍 and 👎 buttons
5. Click 👍 (helpful) or 👎 (unhelpful)
6. If 👎: suggestion modal appears

**Expected Behavior**:
- [ ] Chat loads
- [ ] Can send messages
- [ ] Bot responds
- [ ] Feedback buttons visible
- [ ] Can submit feedback
- [ ] Modal shows on negative feedback
- [ ] Feedback marked in UI

**If error**:
- Check ChatFeedbackButtons component
- Verify chatbot/feedback endpoints
- Check chatbotFeedbackService

---

## Step 5: End-to-End Verification

### API Connectivity ✅
```
curl http://localhost:3000/api/users/profile
# Should return user data or 401 if not authenticated
```

### Frontend Build ✅
```bash
cd web
npm run build
# Should complete with 0 errors
```

### Backend Build ✅
```bash
cd backend
npm run build
# Should complete with 0 errors
```

---

## Step 6: Offline Testing (5 minutes)

### Test Offline Mode:
1. Open DevTools (F12)
2. Go to "Network" tab
3. Click "Offline" checkbox
4. Perform actions:
   - [ ] Send chat message (should queue)
   - [ ] Try to load notifications (should show cached)
   - [ ] Try to start location tracking (should show offline)
5. Go back online
6. Verify data syncs

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Push Notifications | [ ] ✅ | |
| Biometric Settings | [ ] ✅ | |
| Location Sharing | [ ] ✅ | |
| Chatbot Feedback | [ ] ✅ | |
| API Connectivity | [ ] ✅ | |
| Frontend Build | [ ] ✅ | |
| Backend Build | [ ] ✅ | |
| Offline Mode | [ ] ✅ | |

---

## Common Issues & Solutions

### Issue: "Cannot GET /api/..."
**Solution**: 
- Backend not running
- Port 3000 in use
- Check backend logs

### Issue: "Notification bell not visible"
**Solution**:
- Refresh browser (F5)
- Check browser console for errors
- Verify Redux store initialized

### Issue: "Map doesn't display"
**Solution**:
- Google Maps API key not set
- Set `VITE_GOOGLE_MAPS_API_KEY` in `.env.local`
- Wait for script to load

### Issue: "Feedback buttons missing"
**Solution**:
- Check browser console
- Verify ChatbotUI imported ChatFeedbackButtons
- Try refreshing page

### Issue: "Biometric enrollment fails"
**Solution**:
- Check device supports biometric
- Check browser console for errors
- Verify backend endpoints

---

## Success Criteria

✅ All tests pass without errors  
✅ Features responsive on mobile  
✅ No console errors  
✅ API calls successful  
✅ Offline mode working  
✅ Both builds pass  

---

## Next Steps After Testing

If all tests pass:
1. Document any issues found
2. Fix any bugs
3. Deploy to staging
4. Get user feedback
5. Iterate on improvements

If issues found:
1. Note exact error
2. Check logs
3. Refer to SETUP_GUIDE.md
4. Reach out to development team

---

## Time Estimates

- Database setup: 5 min
- Backend startup: 2 min
- Frontend startup: 2 min
- Feature testing: 15-20 min
- Build verification: 5 min
- Offline testing: 5 min

**Total: ~35-45 minutes**

---

## Support Resources

- **SETUP_GUIDE.md** - Detailed setup instructions
- **DEVELOPMENT_STATUS.md** - Current status
- **web/src/services/README.md** - Service documentation
- Browser DevTools console for errors
- Backend logs (check terminal)

---

**Start with "Step 1" above and work through each section.**

Good luck! 🚀
