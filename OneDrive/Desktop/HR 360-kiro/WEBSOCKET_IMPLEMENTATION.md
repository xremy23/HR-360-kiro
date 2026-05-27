# WebSocket Implementation & Web Console

## Overview

This document describes the WebSocket implementation for real-time updates and the web console pages for admin/HR management.

## Architecture

### WebSocket Service (`web/src/services/websocketService.ts`)

The WebSocket service provides:
- **Connection Management**: Automatic connection, reconnection with exponential backoff
- **Event System**: Pub/sub pattern for real-time events
- **Message Queue**: Queues messages when disconnected, flushes on reconnect
- **Heartbeat**: Keeps connection alive with periodic heartbeats
- **Error Handling**: Comprehensive error handling and recovery

#### Key Features

1. **Auto-Reconnection**
   - Attempts up to 5 reconnections
   - Exponential backoff (3s, 6s, 9s, 12s, 15s)
   - Emits `reconnect_failed` event after max attempts

2. **Event Subscription**
   ```typescript
   // Subscribe to events
   websocketService.on('incident:created', (data) => {
     console.log('New incident:', data);
   });

   // Subscribe once
   websocketService.once('alert:created', (data) => {
     console.log('Alert received:', data);
   });

   // Unsubscribe
   const unsubscribe = websocketService.on('checkin:created', handler);
   unsubscribe();
   ```

3. **Message Sending**
   ```typescript
   websocketService.send({
     type: 'incident',
     action: 'created',
     data: { /* incident data */ },
     timestamp: new Date().toISOString(),
   });
   ```

4. **Connection Status**
   ```typescript
   if (websocketService.isConnected()) {
     // Send real-time updates
   }
   ```

### Message Format

All WebSocket messages follow this structure:

```typescript
interface WebSocketMessage {
  type: 'incident' | 'alert' | 'checkin' | 'sos' | 'notification';
  action: 'created' | 'updated' | 'deleted' | 'acknowledged';
  data: any;
  timestamp: string;
}
```

### Event Types

Events are emitted as `{type}:{action}` and also as just `{type}`:

```
incident:created
incident:updated
incident:deleted
alert:created
alert:updated
checkin:created
sos:created
notification:acknowledged
```

## Web Console Pages

### 1. Dashboard (`web/src/pages/Dashboard.tsx`)

**Purpose**: Main console view showing real-time incident status and metrics

**Features**:
- Live status indicator (LIVE/OFFLINE)
- Real-time statistics:
  - Active Incidents
  - Total Check-Ins
  - Pending SOS
  - Response Rate
- Active incidents list
- Recent alerts
- Live activity feed
- Check-in summary with status breakdown

**Components Used**:
- `IncidentCard` - Displays incident details
- `AlertPanel` - Shows alert information
- `CheckInSummary` - Check-in statistics
- `LiveActivityFeed` - Real-time activity stream

### 2. Incident Management (`web/src/pages/IncidentManagement.tsx`)

**Purpose**: Create and manage incidents

**Features**:
- Create new incidents with:
  - Incident type
  - Severity level (Advisory, Watch, Emergency)
  - Drill flag
- View active incidents
- Real-time incident updates

**Form Fields**:
- Incident Type (text input)
- Severity Level (select dropdown)
- Is Drill (checkbox)

### 3. Alert Management (`web/src/pages/AlertManagement.tsx`)

**Purpose**: Broadcast and manage alerts

**Features**:
- Broadcast alerts with:
  - Title
  - Message
  - Severity level
  - Drill flag
  - Team targeting
- View recent alerts
- Real-time alert updates

**Form Fields**:
- Alert Title (text input)
- Message (textarea)
- Severity Level (select dropdown)
- Is Drill (checkbox)

### 4. Console Layout (`web/src/components/ConsoleLayout.tsx`)

**Purpose**: Main layout wrapper for all console pages

**Features**:
- Collapsible sidebar navigation
- Top navigation bar with date and notifications
- Responsive design
- Navigation items:
  - Dashboard
  - Incidents
  - Alerts
  - Check-Ins
  - Users
  - Settings

## Components

### IncidentCard
Displays incident information with severity indicator and timing.

```typescript
<IncidentCard incident={incident} />
```

### AlertPanel
Shows alert details with severity color coding and relative timestamps.

```typescript
<AlertPanel alert={alert} />
```

### CheckInSummary
Displays check-in statistics with visual progress bar.

```typescript
<CheckInSummary />
```

### LiveActivityFeed
Real-time activity stream showing all events.

```typescript
<LiveActivityFeed />
```

## Hooks

### useWebSocket Hook (`web/src/hooks/useWebSocket.ts`)

Custom React hook for WebSocket integration.

**Usage**:
```typescript
const { subscribe, send, isConnected, disconnect } = useWebSocket(token, {
  autoConnect: true,
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
  onError: (error) => console.error('Error:', error),
});

// Subscribe to events
subscribe('incident:created', (data) => {
  console.log('New incident:', data);
});

// Send messages
send({
  type: 'incident',
  action: 'created',
  data: { /* data */ },
  timestamp: new Date().toISOString(),
});

// Check connection
if (isConnected()) {
  // Do something
}
```

## Design System

All components use the centralized design system (`web/src/styles/designSystem.ts`):

### Colors
- **Primary**: Teal (#038F8D), White (#FFFFFF), Black (#000000)
- **Secondary**: Dark Teal (#024F45), Medium Teal (#017473), Light Teal (#9AC0C3)
- **Semantic**: Success, Warning, Error, Info
- **Neutral**: 50-900 scale

### Typography
- **Display**: Display1, Display2, Display3
- **Headings**: H1-H6
- **Body**: Body1, Body2, Body3
- **Labels**: Label1, Label2
- **Caption**: Caption

### Spacing
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- xxl: 32px
- xxxl: 48px

### Border Radius
- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- full: 9999px

## Backend Integration

### WebSocket Server Setup

The backend needs to implement WebSocket support using Socket.io or native WebSockets:

```typescript
// Example with Socket.io
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle incoming messages
  socket.on('incident:created', (data) => {
    // Broadcast to all connected clients
    io.emit('incident:created', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

### Message Broadcasting

When an incident is created via API:

```typescript
// In your incident creation endpoint
const incident = await IncidentEntity.create(data);

// Broadcast via WebSocket
io.emit('incident:created', incident);
```

## Real-Time Event Flow

1. **User Action** (e.g., Create Incident)
   ↓
2. **API Request** to backend
   ↓
3. **Database Update**
   ↓
4. **WebSocket Broadcast** to all connected clients
   ↓
5. **Component Update** via event subscription
   ↓
6. **UI Re-render** with new data

## Environment Variables

Add to `web/.env`:

```env
VITE_WS_URL=ws://localhost:3000
VITE_API_URL=http://localhost:3000
```

## Usage Example

### In a Component

```typescript
import React, { useEffect, useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';

const MyComponent: React.FC = () => {
  const [incidents, setIncidents] = useState([]);
  const { subscribe, isConnected } = useWebSocket(token);

  useEffect(() => {
    const unsubscribe = subscribe('incident:created', (data) => {
      setIncidents((prev) => [data, ...prev]);
    });

    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div>
      <p>Status: {isConnected() ? 'LIVE' : 'OFFLINE'}</p>
      {incidents.map((incident) => (
        <div key={incident.id}>{incident.type}</div>
      ))}
    </div>
  );
};

export default MyComponent;
```

## Performance Considerations

1. **Message Queue**: Prevents message loss during disconnections
2. **Heartbeat**: Keeps connection alive (30-second interval)
3. **Event Handlers**: Errors in handlers don't break other handlers
4. **Memory Management**: Unsubscribe from events when components unmount
5. **Reconnection**: Exponential backoff prevents server overload

## Security

1. **Token Authentication**: WebSocket connection requires JWT token
2. **Message Validation**: All messages validated on server
3. **Rate Limiting**: Implement rate limiting on server
4. **CORS**: Configure CORS for WebSocket connections

## Testing

### Unit Tests

```typescript
describe('WebSocketService', () => {
  it('should connect to server', async () => {
    const service = new WebSocketService();
    await service.connect(token);
    expect(service.isConnected()).toBe(true);
  });

  it('should emit events', (done) => {
    service.on('test:event', (data) => {
      expect(data).toEqual({ message: 'test' });
      done();
    });
    service.send({
      type: 'test',
      action: 'event',
      data: { message: 'test' },
      timestamp: new Date().toISOString(),
    });
  });
});
```

### Integration Tests

```typescript
describe('Dashboard with WebSocket', () => {
  it('should update incidents in real-time', async () => {
    render(<Dashboard />);
    
    // Simulate WebSocket message
    websocketService.emit('incident:created', {
      id: '1',
      type: 'fire',
      severity: 'emergency',
    });

    await waitFor(() => {
      expect(screen.getByText('fire')).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Connection Issues

1. **Check WebSocket URL**: Verify `VITE_WS_URL` is correct
2. **Check Token**: Ensure JWT token is valid
3. **Check Server**: Verify backend WebSocket server is running
4. **Check Firewall**: Ensure WebSocket port is not blocked

### Message Not Received

1. **Check Event Type**: Verify event type matches subscription
2. **Check Connection**: Verify `isConnected()` returns true
3. **Check Message Format**: Verify message structure is correct
4. **Check Server Logs**: Look for errors in backend logs

### Memory Leaks

1. **Unsubscribe**: Always unsubscribe from events in cleanup
2. **Disconnect**: Call `disconnect()` when component unmounts
3. **Check Handlers**: Ensure event handlers don't hold references

## Future Enhancements

1. **Message Compression**: Compress large messages
2. **Offline Queue**: Persist messages to IndexedDB when offline
3. **Message Encryption**: Encrypt sensitive data
4. **Presence Tracking**: Track online users
5. **Typing Indicators**: Show when users are typing
6. **Read Receipts**: Confirm message delivery
7. **Message History**: Retrieve past messages
8. **Selective Broadcasting**: Send to specific users/teams

## Files Created

- `web/src/services/websocketService.ts` - WebSocket service
- `web/src/pages/Dashboard.tsx` - Main dashboard
- `web/src/pages/IncidentManagement.tsx` - Incident management
- `web/src/pages/AlertManagement.tsx` - Alert management
- `web/src/components/IncidentCard.tsx` - Incident card component
- `web/src/components/AlertPanel.tsx` - Alert panel component
- `web/src/components/CheckInSummary.tsx` - Check-in summary component
- `web/src/components/LiveActivityFeed.tsx` - Activity feed component
- `web/src/components/ConsoleLayout.tsx` - Console layout
- `web/src/hooks/useWebSocket.ts` - WebSocket hook

## Next Steps

1. **Backend WebSocket Server**: Implement WebSocket server in backend
2. **Socket.io Integration**: Add Socket.io to backend
3. **Message Broadcasting**: Implement message broadcasting for all events
4. **Authentication**: Add JWT authentication to WebSocket
5. **Testing**: Write unit and integration tests
6. **Deployment**: Deploy to production with proper WebSocket configuration
