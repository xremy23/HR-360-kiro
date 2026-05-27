# Database Integration Testing Guide

## Quick Start

### 1. Start the Backend Server
```powershell
cd backend
npm start
```

Expected output:
```
Initializing database...
Database initialized successfully
Server running on http://localhost:3000
```

### 2. Test Endpoints

Use Postman, curl, or any HTTP client to test the endpoints.

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Get a Token

1. **Register a new user**:
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "orgId": "your-org-id"
}
```

2. **Login**:
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response will include a `token` field. Use this token for all subsequent requests.

## Testing Each Route File

### 1. KB Guides (`/kb`)

#### Get all guides
```bash
GET http://localhost:3000/kb?orgId=your-org-id&limit=10&offset=0
Authorization: Bearer <token>
```

#### Create a guide (Admin only)
```bash
POST http://localhost:3000/kb
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Emergency Procedures",
  "category": "general",
  "type": "procedure",
  "content": "Step 1: Evacuate the building...",
  "mediaUrls": [],
  "isRequired": true
}
```

#### Get guide details
```bash
GET http://localhost:3000/kb/:id
Authorization: Bearer <token>
```

#### Update guide (Admin only)
```bash
PUT http://localhost:3000/kb/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete guide (Admin only)
```bash
DELETE http://localhost:3000/kb/:id
Authorization: Bearer <token>
```

#### Acknowledge guide
```bash
POST http://localhost:3000/kb/:id/acknowledge
Authorization: Bearer <token>
```

### 2. Check-Ins (`/check-ins`)

#### Submit check-in
```bash
POST http://localhost:3000/check-ins
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "safe",
  "notes": "All good",
  "location": {
    "latitude": 14.5994,
    "longitude": 120.9842
  },
  "isDrill": false
}
```

Valid statuses: `safe`, `need_help`, `sos`, `unaccounted`

#### Get team check-ins (Manager only)
```bash
GET http://localhost:3000/check-ins/team/:teamId?incidentId=optional&isDrill=false
Authorization: Bearer <token>
```

#### Get user check-in history
```bash
GET http://localhost:3000/check-ins/history?limit=10&offset=0
Authorization: Bearer <token>
```

#### Get incident check-ins
```bash
GET http://localhost:3000/check-ins/incident/:incidentId
Authorization: Bearer <token>
```

### 3. Alerts (`/alerts`)

#### Get alerts
```bash
GET http://localhost:3000/alerts?orgId=your-org-id&isDrill=false&severity=emergency&limit=10&offset=0
Authorization: Bearer <token>
```

Valid severities: `advisory`, `watch`, `emergency`

#### Broadcast alert (Admin only)
```bash
POST http://localhost:3000/alerts/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Evacuation Alert",
  "message": "Please evacuate the building immediately",
  "severity": "emergency",
  "type": "evacuation",
  "teamIds": ["team-id-1", "team-id-2"],
  "isDrill": false
}
```

#### Get alert notifications
```bash
GET http://localhost:3000/alerts/:id/notifications
Authorization: Bearer <token>
```

#### Mark notification as read
```bash
PUT http://localhost:3000/alerts/:id/notifications/:nId
Authorization: Bearer <token>
```

### 4. Contacts (`/contacts`)

#### Get user contacts
```bash
GET http://localhost:3000/contacts
Authorization: Bearer <token>
```

#### Create contact
```bash
POST http://localhost:3000/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "City Hospital",
  "type": "hotline",
  "phone": "+63912345678",
  "email": "info@hospital.com",
  "category": "medical",
  "address": "123 Hospital St",
  "latitude": 14.5994,
  "longitude": 120.9842,
  "isPinned": true
}
```

Valid types: `hotline`, `personal`, `location-based`

#### Update contact
```bash
PUT http://localhost:3000/contacts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+63987654321",
  "isPinned": false
}
```

#### Delete contact
```bash
DELETE http://localhost:3000/contacts/:id
Authorization: Bearer <token>
```

#### Get nearby services
```bash
GET http://localhost:3000/contacts/nearby?latitude=14.5994&longitude=120.9842&radius=5&type=hotline
Authorization: Bearer <token>
```

### 5. Incidents (`/incidents`)

#### Get incidents
```bash
GET http://localhost:3000/incidents?orgId=your-org-id&isDrill=false&limit=10&offset=0
Authorization: Bearer <token>
```

#### Create incident (Admin only)
```bash
POST http://localhost:3000/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "fire",
  "severity": "emergency",
  "isDrill": false
}
```

#### Get incident details
```bash
GET http://localhost:3000/incidents/:id
Authorization: Bearer <token>
```

#### Get incident summary
```bash
GET http://localhost:3000/incidents/:id/summary
Authorization: Bearer <token>
```

### 6. SOS (`/sos`)

#### Trigger SOS
```bash
POST http://localhost:3000/sos
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Need immediate assistance"
}
```

#### Get SOS escalations (Admin only)
```bash
GET http://localhost:3000/sos/escalations?orgId=your-org-id
Authorization: Bearer <token>
```

### 7. Organization (`/org`)

#### Get organization
```bash
GET http://localhost:3000/org
Authorization: Bearer <token>
```

#### Get organization teams
```bash
GET http://localhost:3000/org/teams
Authorization: Bearer <token>
```

#### Get organization users (Admin only)
```bash
GET http://localhost:3000/org/users?teamId=optional&role=optional&limit=10&offset=0
Authorization: Bearer <token>
```

Valid roles: `admin`, `hr`, `manager`, `employee`

### 8. To-Go Bag (`/tobag`)

#### Get to-go bag items
```bash
GET http://localhost:3000/tobag
Authorization: Bearer <token>
```

#### Create to-go bag item
```bash
POST http://localhost:3000/tobag
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Important Documents",
  "category": "documents",
  "quantity": 1,
  "isPacked": false,
  "notes": "Passport, ID, insurance"
}
```

Valid categories: `documents`, `supplies`, `electronics`, `clothing`, `other`

#### Update to-go bag item
```bash
PUT http://localhost:3000/tobag/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "quantity": 2,
  "isPacked": true
}
```

#### Delete to-go bag item
```bash
DELETE http://localhost:3000/tobag/:id
Authorization: Bearer <token>
```

## Common Test Scenarios

### Scenario 1: Create and Retrieve Data
1. Create a contact
2. Get all contacts
3. Update the contact
4. Delete the contact

### Scenario 2: Multi-User Access
1. Create two users
2. User 1 creates a contact
3. User 2 tries to update User 1's contact (should fail)
4. User 1 updates their own contact (should succeed)

### Scenario 3: Incident Management
1. Create an incident
2. Submit check-ins from multiple users
3. Get incident summary
4. Verify check-in counts match

### Scenario 4: Pagination
1. Create 100+ items
2. Test pagination with different limit/offset values
3. Verify total count is correct

### Scenario 5: Filtering
1. Create guides with different categories
2. Filter by category
3. Verify only matching guides are returned

## Expected Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful",
  "statusCode": 200
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "message": "Items retrieved successfully",
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error description",
  "statusCode": 400
}
```

## Common Error Codes

| Code | Meaning |
|------|---------|
| USER_NOT_FOUND | User not authenticated or not found |
| ORG_NOT_FOUND | Organization not found |
| INVALID_ORG | Organization ID required |
| INVALID_INPUT | Missing or invalid required fields |
| INVALID_STATUS | Invalid status value |
| INVALID_COORDINATES | Invalid latitude/longitude |
| INVALID_PHONE | Invalid phone number format |
| INVALID_SEVERITY | Invalid severity level |
| INVALID_CATEGORY | Invalid category value |
| RESOURCE_NOT_FOUND | Requested resource not found |
| UNAUTHORIZED | User not authorized for this action |
| SERVER_ERROR | Internal server error |

## Debugging Tips

1. **Check database connection**: Verify PostgreSQL is running
2. **Check logs**: Look at server console output for errors
3. **Verify token**: Ensure JWT token is valid and not expired
4. **Check permissions**: Verify user has required role (Admin, Manager, etc.)
5. **Validate input**: Ensure all required fields are provided
6. **Check ownership**: For user-specific resources, verify ownership

## Performance Testing

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" http://localhost:3000/kb?orgId=your-org-id
```

### Query Performance
- Monitor database query times
- Check for N+1 query problems
- Verify indexes are being used

## Cleanup

After testing, you can reset the database:

```bash
# Drop all tables
npm run db:reset

# Or manually in PostgreSQL
DROP TABLE IF EXISTS sos_escalations CASCADE;
DROP TABLE IF EXISTS tobag_items CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS alert_notifications CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS check_ins CASCADE;
DROP TABLE IF EXISTS guide_acknowledgments CASCADE;
DROP TABLE IF EXISTS kb_guide_versions CASCADE;
DROP TABLE IF EXISTS kb_guides CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS offline_maps CASCADE;
```

## Next Steps

1. Run all test scenarios
2. Document any issues found
3. Fix bugs and re-test
4. Performance test with load
5. Security test with invalid inputs
6. Deploy to staging environment
