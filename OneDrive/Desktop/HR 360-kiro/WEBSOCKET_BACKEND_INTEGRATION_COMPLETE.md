# WebSocket Backend Integration - Complete

## What We Just Did

We integrated Socket.io into the backend to enable real-time communication with the web console. This is the **real-time layer** on top of the existing database API.

## Files Created/Modified

### New Files Created

1. **`backend/src/websocket/server.ts`** (200+ lines)
   - WebSocket server implementation
   - JWT authentication middleware
   - Event broadcasting methods
   - Connection management

### Files Modified

1. **`backend/src/server.ts`**
   - Added HTTP server creation
   - Integrated WebSocket initialization
   - Updated startup logs

2. **`backend/src/routes/incidents.ts`**
   - Added WebSocket broadcast on incident creation
   - Imports `getWebSocketServer`

3. **`backend/src/routes/alerts.ts`**
   - Added WebSocket broadcast on alert creation
   - Imports `getWebSocketServer`

4. **`backend/src/routes/checkins.ts`**
   - Added WebSocket broadcast on check-in creation
   - Imports `getWebSocketServer`

5. **`backend/src/routes/sos.ts`**
   - Added WebSocket broadcast on SOS creation
   - Imports `getWebSocketServer`

6. **`backend/package.json`**
   - Added `socket.io: ^4.7.0` dependency

## How It Works

### 1. Connection Flow
```
Client (Web Console)
    ↓
WebSocket Connection with JWT Token
    ↓
Backend WebSocket Server
    ↓
Authentication Middleware (verifies JWT)
    ↓
Connection Established
```

### 2. Event Broadcasting Flow
```
User Action (e.g., Create Incident)
    ↓
API Request to Backend
    ↓
Database Update (via Entity)
    ↓
WebSocket Broadcast
    ↓
All Connected Clients Receive Event
    ↓
Frontend Updates UI in Real-Time
```

### 3. Event Types Broadcast

- **incident:created** - When admin creates incident
- **alert:created** - When admin broadcasts alert
- **checkin:created** - When user submits check-in
- **sos:created** - When user triggers SOS

## WebSocket Server Features

### Authentication
```typescript
// JWT token required in connection
const token = socket.handshake.auth.token;
const decoded = jwt.verify(token, JWT_SECRET);
socket.data.userId = decoded.id;
socket.data.orgId = decoded.orgId;
```

### Broadcasting Methods
```typescript
wsServer.broadcastIncidentCreated(incident);
wsServer.broadcastAlertCreated(alert);
wsServer.broadcastCheckInCreated(checkIn);
wsServer.broadcastSOSCreated(sos);
wsServer.broadcastToOrganization(orgId, event, data);
```

### Connection Management
```typescript
// Track connected users
connectedUsers: Map<string, string> // userId -> socketId
userOrganizations: Map<string, string> // userId -> orgId

// Get connected count
wsServer.getConnectedUsersCount();
```

## Environment Variables

Add to `backend/.env`:

```env
# WebSocket Configuration
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key
API_PORT=3000
```

## Testing the Integration

### 1. Start Backend
```bash
cd backend
npm install  # Install socket.io
npm run dev
```

Expected output:
```
✅ Server running on http://localhost:3000
🔌 WebSocket server ready on ws://localhost:3000
```

### 2. Start Web Console
```bash
cd web
npm run dev
```

### 3. Test Real-Time Updates

1. Open web console at `http://localhost:5173`
2. Login with credentials
3. Create an incident via the Incident Management page
4. Watch the Dashboard update in real-time
5. Create an alert via Alert Management page
6. Watch it appear in the activity feed

## How Frontend Connects

The web console automatically connects via the `useWebSocket` hook:

```typescript
const { subscribe, send, isConnected } = useWebSocket(token, {
  autoConnect: true,
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
});

// Subscribe to events
subscribe('incident:created', (data) => {
  console.log('New incident:', data);
});
```

## Error Handling

### If WebSocket Fails
- API requests still work (WebSocket is optional)
- Console logs warning but doesn't fail
- Frontend shows "OFFLINE" status
- Auto-reconnection attempts (up to 5 times)

### If Backend Crashes
- Frontend detects disconnection
- Shows "OFFLINE" status
- Auto-reconnects when backend restarts

## Performance Considerations

1. **Message Queuing**: Messages queued when offline, sent on reconnect
2. **Heartbeat**: 30-second heartbeat keeps connection alive
3. **Exponential Backoff**: Reconnection delays increase (3s, 6s, 9s, 12s, 15s)
4. **Efficient Broadcasting**: Only sends to connected clients

## Security

1. **JWT Authentication**: All connections require valid JWT token
2. **Token Verification**: Tokens verified on every connection
3. **CORS Configuration**: Restricted to frontend URL
4. **Message Validation**: All messages validated on server

## Monitoring

### Check Connected Users
```typescript
const count = wsServer.getConnectedUsersCount();
console.log(`Connected users: ${count}`);
```

### View Logs
```
[2026-05-26T14:30:00.000Z] User connected: user-id-123
[2026-05-26T14:30:05.000Z] Broadcast: incident:created
[2026-05-26T14:30:10.000Z] User disconnected: user-id-123
```

## Troubleshooting

### WebSocket Connection Fails
1. Check `FRONTEND_URL` in `.env`
2. Verify JWT token is valid
3. Check firewall allows WebSocket
4. Check browser console for errors

### Events Not Received
1. Verify connection is established (check "LIVE" status)
2. Check event names match subscriptions
3. Check browser console for errors
4. Check server logs for broadcasts

### Memory Issues
1. Check number of connected users
2. Monitor message queue size
3. Check for memory leaks in event handlers

## Next Steps

### Immediate
- ✅ WebSocket server created
- ✅ Routes updated to broadcast
- ✅ Package.json updated
- ✅ Ready to test

### Testing
1. Run `npm install` in backend
2. Start backend with `npm run dev`
3. Start web console with `npm run dev`
4. Test real-time updates

### Production
1. Configure CORS for production URL
2. Set up monitoring and logging
3. Configure rate limiting
4. Set up SSL/TLS for WSS
5. Deploy to production

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Console (React)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Dashboard | Incidents | Alerts | Check-Ins          │  │
│  │ useWebSocket Hook                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express + Socket.io)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WebSocket Server                                     │  │
│  │ - Authentication                                     │  │
│  │ - Connection Management                              │  │
│  │ - Event Broadcasting                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Routes                                           │  │
│  │ - Incidents (broadcasts incident:created)            │  │
│  │ - Alerts (broadcasts alert:created)                  │  │
│  │ - Check-Ins (broadcasts checkin:created)             │  │
│  │ - SOS (broadcasts sos:created)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Database Layer (PostgreSQL)                          │  │
│  │ - 14 Tables                                          │  │
│  │ - 9 Entities                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Summary

✅ **WebSocket Backend Integration Complete**

The backend now has:
- Real-time communication capability
- Event broadcasting for incidents, alerts, check-ins, and SOS
- JWT authentication for WebSocket connections
- Connection management and monitoring
- Error handling and auto-reconnection support

The frontend web console can now:
- Connect to WebSocket server
- Receive real-time updates
- Display live incident status
- Show activity feed
- Update statistics in real-time

**Status**: Ready for testing and deployment

---

**Created**: May 26, 2026
**Version**: 1.0.0
**Status**: Complete
