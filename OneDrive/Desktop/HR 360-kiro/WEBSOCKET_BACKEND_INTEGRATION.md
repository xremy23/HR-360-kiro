# WebSocket Backend Integration Guide

## Overview

This guide explains how to integrate WebSocket support into the backend to work with the web console.

## Prerequisites

- Node.js 16+
- Express.js backend running
- PostgreSQL database
- JWT authentication implemented

## Installation

### 1. Install Socket.io

```bash
cd backend
npm install socket.io
npm install --save-dev @types/socket.io
```

### 2. Update Backend Package.json

```json
{
  "dependencies": {
    "socket.io": "^4.7.0",
    "cors": "^2.8.5"
  }
}
```

## Implementation

### 1. Create WebSocket Server (`backend/src/websocket/server.ts`)

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../middleware/auth';

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = verifyToken(token);
        socket.data.userId = decoded.id;
        socket.data.orgId = decoded.orgId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.userId}`);
      this.connectedUsers.set(socket.data.userId, socket.id);

      // Broadcast user online status
      this.io.emit('user:online', {
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.userId}`);
        this.connectedUsers.delete(socket.data.userId);
        this.io.emit('user:offline', {
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.data.userId}:`, error);
      });
    });
  }

  public broadcastIncident(incident: any): void {
    this.io.emit('incident:created', {
      type: 'incident',
      action: 'created',
      data: incident,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastAlert(alert: any): void {
    this.io.emit('alert:created', {
      type: 'alert',
      action: 'created',
      data: alert,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastCheckIn(checkIn: any): void {
    this.io.emit('checkin:created', {
      type: 'checkin',
      action: 'created',
      data: checkIn,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastSOS(sos: any): void {
    this.io.emit('sos:created', {
      type: 'sos',
      action: 'created',
      data: sos,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastToOrg(orgId: string, event: string, data: any): void {
    const users = Array.from(this.connectedUsers.entries())
      .filter(([userId]) => {
        // Filter by organization (you'll need to implement this)
        return true;
      })
      .map(([, socketId]) => socketId);

    users.forEach((socketId) => {
      this.io.to(socketId).emit(event, {
        type: event.split(':')[0],
        action: event.split(':')[1],
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  public getConnectedUsers(): number {
    return this.connectedUsers.size;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export let wsServer: WebSocketServer;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  wsServer = new WebSocketServer(httpServer);
  return wsServer;
}
```

### 2. Update Server Entry Point (`backend/src/server.ts`)

```typescript
import express from 'express';
import { createServer } from 'http';
import { initializeWebSocket } from './websocket/server';
import { initializeDatabase } from './config/database';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
const wsServer = initializeWebSocket(httpServer);

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/kb', kbRoutes);
app.use('/check-ins', checkInRoutes);
app.use('/alerts', alertRoutes);
app.use('/contacts', contactRoutes);
app.use('/incidents', incidentRoutes);
app.use('/sos', sosRoutes);
app.use('/org', organizationRoutes);
app.use('/tobag', tobagRoutes);

// Initialize database
initializeDatabase().then(() => {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server ready`);
  });
});

export default app;
```

### 3. Update Incident Routes (`backend/src/routes/incidents.ts`)

```typescript
import { wsServer } from '../websocket/server';

// In POST /incidents endpoint
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // ... existing code ...
    
    const incident = await IncidentEntity.create({
      orgId: req.user.orgId,
      type,
      severity,
      startTime: new Date(),
      isDrill: isDrill || false,
      createdBy: req.user.id,
    });

    // Broadcast via WebSocket
    wsServer.broadcastIncident(incident);

    return sendSuccess(res, incident, 'Incident created successfully', 201);
  } catch (error) {
    console.error('Create incident error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to create incident', 500);
  }
});
```

### 4. Update Alert Routes (`backend/src/routes/alerts.ts`)

```typescript
import { wsServer } from '../websocket/server';

// In POST /alerts/broadcast endpoint
router.post('/broadcast', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // ... existing code ...
    
    const alert = await AlertEntity.create({
      orgId: req.user.orgId,
      teamIds: teamIds || [],
      title,
      message,
      severity,
      type,
      createdBy: req.user.id,
      isDrill: isDrill || false,
    });

    // Broadcast via WebSocket
    wsServer.broadcastAlert(alert);

    return sendSuccess(res, alert, 'Alert broadcast successfully', 201);
  } catch (error) {
    console.error('Broadcast alert error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to broadcast alert', 500);
  }
});
```

### 5. Update Check-In Routes (`backend/src/routes/checkins.ts`)

```typescript
import { wsServer } from '../websocket/server';

// In POST /check-ins endpoint
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // ... existing code ...
    
    const checkIn = await CheckInEntity.create({
      userId: req.user.id,
      teamId: req.user.teamId || '',
      status,
      notes,
      latitude: location?.latitude,
      longitude: location?.longitude,
      incidentId,
      isDrill: isDrill || false,
    });

    // Broadcast via WebSocket
    wsServer.broadcastCheckIn(checkIn);

    return sendSuccess(res, checkIn, 'Check-in submitted successfully', 201);
  } catch (error) {
    console.error('Submit check-in error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to submit check-in', 500);
  }
});
```

### 6. Update SOS Routes (`backend/src/routes/sos.ts`)

```typescript
import { wsServer } from '../websocket/server';

// In POST /sos endpoint
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // ... existing code ...
    
    const sos = await SOSEscalationEntity.create({
      userId: req.user.id,
      notes,
      status: 'pending',
    });

    // Broadcast via WebSocket
    wsServer.broadcastSOS(sos);

    return sendSuccess(res, sos, 'SOS triggered successfully', 201);
  } catch (error) {
    console.error('Trigger SOS error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to trigger SOS', 500);
  }
});
```

## Environment Variables

Add to `backend/.env`:

```env
# WebSocket Configuration
FRONTEND_URL=http://localhost:5173
WS_PORT=3000

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Testing WebSocket Connection

### 1. Test with curl

```bash
# Start the server
npm start

# In another terminal, test WebSocket
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:3000/socket.io/?token=YOUR_JWT_TOKEN
```

### 2. Test with Socket.io Client

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
  },
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('incident:created', (data) => {
  console.log('New incident:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

## Deployment Considerations

### 1. Production Setup

```typescript
// Use environment variables
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Fallback to polling
});
```

### 2. Load Balancing

For multiple server instances, use Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient();
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 3. Monitoring

```typescript
// Track connected users
setInterval(() => {
  console.log(`Connected users: ${wsServer.getConnectedUsers()}`);
}, 60000);

// Log events
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] User connected: ${socket.data.userId}`);
});
```

## Security Best Practices

1. **Always validate tokens**
2. **Implement rate limiting**
3. **Sanitize message data**
4. **Use HTTPS/WSS in production**
5. **Implement message size limits**
6. **Add request logging**
7. **Monitor for suspicious activity**

## Troubleshooting

### Connection Refused
- Check if server is running
- Verify port is correct
- Check firewall settings

### Authentication Failed
- Verify JWT token is valid
- Check token format
- Ensure token is passed in auth

### Messages Not Received
- Check event names match
- Verify connection is established
- Check browser console for errors
- Check server logs

## Performance Optimization

1. **Message Compression**: Enable compression for large messages
2. **Connection Pooling**: Reuse connections
3. **Batch Updates**: Send multiple updates in one message
4. **Selective Broadcasting**: Only send to relevant users
5. **Message Queuing**: Queue messages during high load

## Monitoring and Logging

```typescript
// Log all events
io.on('connection', (socket) => {
  socket.onAny((event, ...args) => {
    console.log(`Event: ${event}`, args);
  });
});

// Monitor performance
setInterval(() => {
  const stats = {
    connectedUsers: wsServer.getConnectedUsers(),
    timestamp: new Date().toISOString(),
  };
  console.log('WebSocket Stats:', stats);
}, 60000);
```

## Next Steps

1. ✅ Install Socket.io
2. ✅ Create WebSocket server
3. ✅ Update server entry point
4. ✅ Update routes to broadcast events
5. ✅ Test WebSocket connection
6. ✅ Deploy to production
7. ✅ Monitor and optimize

## Files to Update

- `backend/src/server.ts` - Add WebSocket initialization
- `backend/src/routes/incidents.ts` - Add broadcast
- `backend/src/routes/alerts.ts` - Add broadcast
- `backend/src/routes/checkins.ts` - Add broadcast
- `backend/src/routes/sos.ts` - Add broadcast
- `backend/.env` - Add WebSocket config
- `backend/package.json` - Add Socket.io dependency

## Verification Checklist

- [ ] Socket.io installed
- [ ] WebSocket server created
- [ ] Server entry point updated
- [ ] Routes updated with broadcasts
- [ ] Environment variables configured
- [ ] WebSocket connection tested
- [ ] Real-time events working
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Deployment ready

---

**Status**: Ready for implementation
**Estimated Time**: 2-3 hours
**Difficulty**: Medium
