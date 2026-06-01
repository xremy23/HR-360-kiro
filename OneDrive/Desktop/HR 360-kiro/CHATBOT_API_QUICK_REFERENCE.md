# Chatbot API Quick Reference

## Base URL
```
http://localhost:3000/api/chatbot
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

---

## User Endpoints

### 1. Save Chat Message
```
POST /messages
Content-Type: application/json

{
  "userQuestion": "What should I do in an earthquake?",
  "botResponse": "In an earthquake, follow these steps...",
  "context": {
    "category": "natural_disaster",
    "intent": "emergency_procedure"
  }
}

Response: 201 Created
{
  "id": "uuid",
  "userId": "uuid",
  "organizationId": "uuid",
  "userQuestion": "...",
  "botResponse": "...",
  "status": "active",
  "createdAt": "2026-06-01T..."
}
```

### 2. Submit Feedback
```
POST /messages/:id/feedback
Content-Type: application/json

{
  "isHelpful": false,
  "feedbackText": "The response didn't address my specific situation"
}

Response: 200 OK
{
  "id": "uuid",
  "isHelpful": false,
  "feedbackText": "...",
  "feedbackProvidedAt": "2026-06-01T..."
}
```

### 3. Get Chat History
```
GET /history?limit=50&offset=0
Authorization: Bearer <token>

Response: 200 OK
{
  "items": [
    {
      "id": "uuid",
      "userQuestion": "...",
      "botResponse": "...",
      "isHelpful": true,
      "createdAt": "2026-06-01T..."
    }
  ],
  "total": 150
}
```

---

## Admin Endpoints

### 1. Get Feedback Queue
```
GET /admin/feedback-queue?status=pending&priority=high&limit=50&offset=0
Authorization: Bearer <admin-token>

Query Parameters:
- status: pending | reviewed | resolved | archived
- priority: high | medium | low
- limit: 1-100 (default: 50)
- offset: pagination offset (default: 0)

Response: 200 OK
{
  "items": [
    {
      "id": "uuid",
      "chatMessageId": "uuid",
      "userQuestion": "What is the evacuation procedure?",
      "botResponse": "The evacuation procedure is...",
      "userFeedback": "This didn't help",
      "isHelpful": false,
      "priority": "high",
      "status": "pending",
      "assignedTo": null,
      "createdAt": "2026-06-01T..."
    }
  ],
  "total": 25
}
```

### 2. Get Specific Feedback Item
```
GET /admin/feedback-queue/:id
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "id": "uuid",
  "chatMessageId": "uuid",
  "userQuestion": "...",
  "botResponse": "...",
  "userFeedback": "...",
  "isHelpful": false,
  "priority": "high",
  "status": "pending",
  "assignedTo": null,
  "createdAt": "2026-06-01T..."
}
```

### 3. Update Feedback Item
```
PATCH /admin/feedback-queue/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "reviewed",
  "adminAction": "Assigned to team for response improvement",
  "assignedTo": "user-uuid"
}

Response: 200 OK
{
  "id": "uuid",
  "status": "reviewed",
  "assignedTo": "user-uuid",
  "reviewedAt": "2026-06-01T..."
}
```

### 4. Resolve Feedback Item
```
POST /admin/feedback-queue/:id/resolve
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "adminAction": "Updated chatbot response pattern to address this question",
  "updatedResponseId": "response-uuid"
}

Response: 200 OK
{
  "id": "uuid",
  "status": "resolved",
  "resolvedAt": "2026-06-01T...",
  "adminAction": "..."
}
```

### 5. Create/Update Response Pattern
```
POST /admin/responses
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "questionPattern": "evacuation|emergency exit|leave building",
  "response": "In case of emergency evacuation: 1. Proceed to nearest exit... 2. Follow floor marshals... 3. Assemble at designated meeting point",
  "category": "work_protocol",
  "priority": 10
}

Response: 201 Created
{
  "id": "uuid",
  "organizationId": "uuid",
  "questionPattern": "...",
  "response": "...",
  "category": "work_protocol",
  "priority": 10,
  "isActive": true,
  "createdAt": "2026-06-01T..."
}
```

### 6. Get Response Patterns
```
GET /admin/responses?category=work_protocol&limit=100&offset=0
Authorization: Bearer <admin-token>

Query Parameters:
- category: natural_disaster | hr_protocol | work_protocol | emergency_procedure | general
- limit: 1-500 (default: 100)
- offset: pagination offset (default: 0)

Response: 200 OK
{
  "items": [
    {
      "id": "uuid",
      "questionPattern": "...",
      "response": "...",
      "category": "work_protocol",
      "priority": 10,
      "isActive": true,
      "createdAt": "2026-06-01T..."
    }
  ],
  "total": 45
}
```

### 7. Get Chatbot Statistics
```
GET /admin/stats
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "totalMessages": 1250,
  "helpfulMessages": 1050,
  "unhelpfulMessages": 200,
  "helpfulPercentage": 84,
  "pendingFeedback": 15,
  "averageResponseLength": 245
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "userQuestion and botResponse are required"
}
```

### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to save chat message"
}
```

---

## Status Values

### Feedback Status
- `pending` - New feedback, not yet reviewed
- `reviewed` - Reviewed by admin
- `resolved` - Action taken and resolved
- `archived` - Archived without action

### Priority Levels
- `high` - Urgent, affects many users
- `medium` - Standard priority
- `low` - Nice to have

### Chat Message Status
- `active` - Current conversation
- `flagged` - Marked for review
- `archived` - Old conversation

---

## Categories

- `natural_disaster` - Earthquake, flood, hurricane, etc.
- `hr_protocol` - HR policies, benefits, procedures
- `work_protocol` - Workplace safety, procedures
- `emergency_procedure` - Emergency response steps
- `general` - General information

---

## Example Workflows

### Workflow 1: User Asks Question and Provides Feedback

```bash
# 1. Save chat message
curl -X POST http://localhost:3000/api/chatbot/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuestion": "What should I do in an earthquake?",
    "botResponse": "In an earthquake, drop, cover, and hold on...",
    "context": {"category": "natural_disaster"}
  }'

# Response: 201 Created with message ID

# 2. User provides feedback (not helpful)
curl -X POST http://localhost:3000/api/chatbot/messages/<message-id>/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isHelpful": false,
    "feedbackText": "Needed more specific information about my building"
  }'

# Response: 200 OK - Feedback saved and added to queue
```

### Workflow 2: Admin Reviews and Improves Response

```bash
# 1. Get feedback queue
curl -X GET "http://localhost:3000/api/chatbot/admin/feedback-queue?status=pending&priority=high" \
  -H "Authorization: Bearer <admin-token>"

# Response: List of pending feedback items

# 2. Get specific feedback item
curl -X GET http://localhost:3000/api/chatbot/admin/feedback-queue/<feedback-id> \
  -H "Authorization: Bearer <admin-token>"

# Response: Detailed feedback item

# 3. Create improved response pattern
curl -X POST http://localhost:3000/api/chatbot/admin/responses \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questionPattern": "earthquake|building safety|what to do",
    "response": "In an earthquake: 1. Drop to hands and knees... 2. Take cover under sturdy desk... 3. Hold on until shaking stops... 4. Check for injuries...",
    "category": "natural_disaster",
    "priority": 10
  }'

# Response: 201 Created with response ID

# 4. Resolve feedback item
curl -X POST http://localhost:3000/api/chatbot/admin/feedback-queue/<feedback-id>/resolve \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "adminAction": "Created improved response pattern for earthquake safety",
    "updatedResponseId": "<response-id>"
  }'

# Response: 200 OK - Feedback marked as resolved
```

### Workflow 3: Get Performance Statistics

```bash
# Get chatbot statistics
curl -X GET http://localhost:3000/api/chatbot/admin/stats \
  -H "Authorization: Bearer <admin-token>"

# Response:
# {
#   "totalMessages": 1250,
#   "helpfulMessages": 1050,
#   "unhelpfulMessages": 200,
#   "helpfulPercentage": 84,
#   "pendingFeedback": 15,
#   "averageResponseLength": 245
# }
```

---

## Testing with cURL

### Set Variables
```bash
TOKEN="your-jwt-token"
ADMIN_TOKEN="your-admin-jwt-token"
BASE_URL="http://localhost:3000/api/chatbot"
```

### Test User Endpoint
```bash
curl -X POST $BASE_URL/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userQuestion": "Test question",
    "botResponse": "Test response"
  }'
```

### Test Admin Endpoint
```bash
curl -X GET "$BASE_URL/admin/feedback-queue?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Admin endpoints: Same as general

---

## Response Times

- Save message: < 50ms
- Get feedback queue: < 100ms
- Get statistics: < 200ms
- Create response: < 50ms

---

## Pagination

All list endpoints support pagination:
- `limit`: 1-100 (default: 50)
- `offset`: 0+ (default: 0)

Example:
```
GET /admin/feedback-queue?limit=25&offset=50
```

---

## Documentation

For more details, see:
- `CHATBOT_ADMIN_GUIDE.md` - Complete guide
- `README.md` - Project overview
- `ARCHITECTURE.md` - System design

---

**Last Updated**: June 1, 2026  
**API Version**: 1.0.0  
**Status**: ✅ Production Ready
