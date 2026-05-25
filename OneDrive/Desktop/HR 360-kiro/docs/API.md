# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All endpoints (except auth) require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  },
  "statusCode": 400
}
```

## Endpoints

### Authentication

#### Send Verification Email
```
POST /auth/send-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "message": "Verification code sent to email"
}
```

#### Verify Email & Create Session
```
POST /auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "orgId": "uuid",
      "teamId": "uuid",
      "biometricEnabled": false,
      "emergencyContacts": []
    }
  }
}
```

#### Join Organization
```
POST /auth/join-org
Content-Type: application/json

{
  "email": "user@example.com",
  "inviteCode": "ABC123",
  "emailDomain": "company.com"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "orgId": "uuid",
    "orgName": "Company Name"
  }
}
```

#### Refresh Token
```
POST /auth/refresh-token
Authorization: Bearer <refresh_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Users

#### Get User Profile
```
GET /users/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "orgId": "uuid",
    "teamId": "uuid",
    "departmentId": "uuid",
    "address": "123 Main St",
    "latitude": 14.5995,
    "longitude": 120.9842,
    "biometricEnabled": false,
    "emergencyContacts": [
      {
        "id": "uuid",
        "name": "Jane Doe",
        "relationship": "Spouse",
        "phone": "+63912345678",
        "email": "jane@example.com",
        "isPrimary": true
      }
    ]
  }
}
```

#### Update User Profile
```
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "latitude": 14.5995,
  "longitude": 120.9842,
  "emergencyContacts": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+63912345678",
      "email": "jane@example.com",
      "isPrimary": true
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated user */ }
}
```

#### Enable Biometric
```
POST /users/biometric/enable
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "faceId" | "fingerprint" | "both"
}

Response: 200 OK
{
  "success": true,
  "message": "Biometric authentication enabled"
}
```

#### Disable Biometric
```
POST /users/biometric/disable
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Biometric authentication disabled"
}
```

### Knowledge Base

#### Get KB Guides
```
GET /kb/guides?orgId=uuid&category=general&type=typhoon
Authorization: Bearer <token>

Query Parameters:
- orgId (required): Organization ID
- category (optional): "general" | "org-specific"
- type (optional): Guide type
- limit (optional): Default 50
- offset (optional): Default 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "title": "Typhoon Safety Guide",
      "category": "general",
      "type": "typhoon",
      "content": "...",
      "mediaUrls": ["url1", "url2"],
      "isRequired": true,
      "version": 1,
      "createdBy": "uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "updatedBy": "uuid"
    }
  ]
}
```

#### Get KB Guide Details
```
GET /kb/guides/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": { /* guide object */ }
}
```

#### Get Guide Version History
```
GET /kb/guides/:id/versions
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "version": 2,
      "content": "...",
      "createdAt": "2024-01-02T00:00:00Z",
      "createdBy": "uuid"
    },
    {
      "version": 1,
      "content": "...",
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": "uuid"
    }
  ]
}
```

#### Create KB Guide (Admin)
```
POST /kb/guides
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Typhoon Safety Guide",
  "category": "general",
  "type": "typhoon",
  "content": "...",
  "mediaUrls": ["url1", "url2"],
  "isRequired": true
}

Response: 201 Created
{
  "success": true,
  "data": { /* created guide */ }
}
```

#### Update KB Guide (Admin)
```
PUT /kb/guides/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "isRequired": false
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated guide */ }
}
```

#### Delete KB Guide (Admin)
```
DELETE /kb/guides/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Guide deleted successfully"
}
```

#### Acknowledge Guide
```
POST /kb/guides/:id/acknowledge
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Guide acknowledged"
}
```

### Check-Ins

#### Submit Check-In
```
POST /check-ins
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "safe" | "need_help" | "sos",
  "notes": "Optional notes",
  "location": {
    "latitude": 14.5995,
    "longitude": 120.9842
  },
  "incidentId": "uuid",
  "isDrill": false
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "teamId": "uuid",
    "status": "safe",
    "timestamp": "2024-01-01T12:00:00Z",
    "syncedToServer": true
  }
}
```

#### Get Team Check-Ins
```
GET /check-ins/team/:teamId
Authorization: Bearer <token>

Query Parameters:
- incidentId (optional): Filter by incident
- isDrill (optional): Filter by drill status

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "userName": "John Doe",
      "status": "safe",
      "timestamp": "2024-01-01T12:00:00Z",
      "notes": "All good"
    }
  ]
}
```

#### Get Check-In History
```
GET /check-ins/history
Authorization: Bearer <token>

Query Parameters:
- limit (optional): Default 50
- offset (optional): Default 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "safe",
      "timestamp": "2024-01-01T12:00:00Z",
      "incidentId": "uuid",
      "isDrill": false
    }
  ]
}
```

#### Get Incident Check-Ins
```
GET /check-ins/incident/:incidentId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "userName": "John Doe",
      "teamId": "uuid",
      "status": "safe",
      "timestamp": "2024-01-01T12:00:00Z",
      "notes": "All good"
    }
  ]
}
```

### Alerts

#### Get Alerts
```
GET /alerts?orgId=uuid&isDrill=false
Authorization: Bearer <token>

Query Parameters:
- orgId (required): Organization ID
- isDrill (optional): Filter by drill status
- severity (optional): "advisory" | "watch" | "emergency"
- limit (optional): Default 50
- offset (optional): Default 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "title": "Typhoon Alert",
      "message": "Typhoon approaching...",
      "severity": "emergency",
      "type": "typhoon",
      "createdAt": "2024-01-01T12:00:00Z",
      "expiresAt": "2024-01-02T12:00:00Z",
      "isDrill": false
    }
  ]
}
```

#### Broadcast Alert (Admin)
```
POST /alerts/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Typhoon Alert",
  "message": "Typhoon approaching...",
  "severity": "emergency",
  "type": "typhoon",
  "teamIds": ["uuid1", "uuid2"],
  "isDrill": false
}

Response: 201 Created
{
  "success": true,
  "data": { /* created alert */ }
}
```

#### Get Alert Notifications
```
GET /alerts/:id/notifications
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "alertId": "uuid",
      "read": false,
      "receivedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### Mark Notification as Read
```
PUT /alerts/:id/notifications/:nId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Contacts

#### Get Contacts
```
GET /contacts
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Emergency Hotline",
      "type": "hotline",
      "phone": "+63912345678",
      "category": "Police",
      "isPinned": true
    }
  ]
}
```

#### Create Contact
```
POST /contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Emergency Hotline",
  "type": "hotline" | "personal" | "location-based",
  "phone": "+63912345678",
  "email": "contact@example.com",
  "category": "Police",
  "address": "123 Main St",
  "latitude": 14.5995,
  "longitude": 120.9842,
  "isPinned": true
}

Response: 201 Created
{
  "success": true,
  "data": { /* created contact */ }
}
```

#### Update Contact
```
PUT /contacts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+63987654321",
  "isPinned": false
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated contact */ }
}
```

#### Delete Contact
```
DELETE /contacts/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Contact deleted"
}
```

#### Get Nearby Services
```
GET /contacts/nearby?latitude=14.5995&longitude=120.9842&radius=5
Authorization: Bearer <token>

Query Parameters:
- latitude (required): User latitude
- longitude (required): User longitude
- radius (optional): Search radius in km, default 5
- type (optional): "hospital" | "fire_station" | "police" | "barangay"

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "City Hospital",
      "type": "hospital",
      "phone": "+63912345678",
      "address": "456 Hospital Ave",
      "latitude": 14.6000,
      "longitude": 120.9850,
      "distance": 0.8
    }
  ]
}
```

### To-Go Bag

#### Get To-Go Bag Items
```
GET /tobag
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Passport",
      "category": "documents",
      "quantity": 1,
      "isPacked": true,
      "notes": "In safe"
    }
  ]
}
```

#### Create To-Go Bag Item
```
POST /tobag
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Passport",
  "category": "documents" | "supplies" | "electronics" | "clothing" | "other",
  "quantity": 1,
  "isPacked": false,
  "notes": "Optional notes"
}

Response: 201 Created
{
  "success": true,
  "data": { /* created item */ }
}
```

#### Update To-Go Bag Item
```
PUT /tobag/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "quantity": 2,
  "isPacked": true
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated item */ }
}
```

#### Delete To-Go Bag Item
```
DELETE /tobag/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Item deleted"
}
```

### SOS

#### Trigger SOS
```
POST /sos
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Optional emergency notes"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "initiatedAt": "2024-01-01T12:00:00Z",
    "status": "pending"
  }
}
```

#### Get SOS Escalations (Admin)
```
GET /sos/escalations?orgId=uuid
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "initiatedAt": "2024-01-01T12:00:00Z",
      "status": "notified_manager",
      "managerNotifiedAt": "2024-01-01T12:00:05Z"
    }
  ]
}
```

### Incidents

#### Get Incidents
```
GET /incidents?orgId=uuid&isDrill=false
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "type": "typhoon",
      "severity": "emergency",
      "startTime": "2024-01-01T12:00:00Z",
      "endTime": null,
      "isDrill": false,
      "createdBy": "uuid"
    }
  ]
}
```

#### Create Incident (Admin)
```
POST /incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "typhoon",
  "severity": "emergency",
  "isDrill": false
}

Response: 201 Created
{
  "success": true,
  "data": { /* created incident */ }
}
```

#### Get Incident Details
```
GET /incidents/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": { /* incident with check-ins */ }
}
```

#### Get Incident Check-In Summary
```
GET /incidents/:id/summary
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "totalMembers": 100,
    "checkedIn": 85,
    "notCheckedIn": 15,
    "safe": 80,
    "needHelp": 4,
    "sos": 1,
    "responseRate": 85
  }
}
```

### Organization

#### Get Organization
```
GET /org
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Company Name",
    "emailDomain": "company.com",
    "inviteCode": "ABC123",
    "logo": "url"
  }
}
```

#### Get Teams
```
GET /org/teams
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "managerId": "uuid",
      "memberCount": 10
    }
  ]
}
```

#### Get Organization Users (Admin)
```
GET /org/users
Authorization: Bearer <token>

Query Parameters:
- teamId (optional): Filter by team
- role (optional): Filter by role
- limit (optional): Default 50
- offset (optional): Default 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "teamId": "uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_EMAIL | 400 | Invalid email format |
| INVALID_CODE | 400 | Invalid verification code |
| ORG_NOT_FOUND | 404 | Organization not found |
| USER_NOT_FOUND | 404 | User not found |
| UNAUTHORIZED | 401 | Unauthorized access |
| FORBIDDEN | 403 | Forbidden access |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

## Rate Limiting

- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

## Pagination

Use `limit` and `offset` query parameters:

```
GET /api/resource?limit=50&offset=0
```

Default limit: 50
Maximum limit: 100

## Timestamps

All timestamps are in ISO 8601 format (UTC):
```
2024-01-01T12:00:00Z
```

## WebSocket Events

### Connection
```
ws://localhost:3001
```

### Events
- `alert:broadcast` - New alert broadcast
- `checkin:update` - Team member check-in
- `sos:triggered` - SOS triggered
- `incident:created` - New incident created
- `incident:ended` - Incident ended

### Example
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  
  if (type === 'alert:broadcast') {
    console.log('New alert:', data);
  }
};
```
