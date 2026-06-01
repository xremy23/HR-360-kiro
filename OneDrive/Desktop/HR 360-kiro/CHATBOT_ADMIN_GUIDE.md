# Chatbot Admin Dashboard Guide

## Overview

The HR 360 Emergency Management System includes an intelligent chatbot with an admin feedback management system. Admins can view user questions, feedback, and continuously improve chatbot responses based on real user interactions.

## Features

### 1. User Chatbot Interactions
- Users can ask questions to the chatbot
- Chatbot provides responses based on trained patterns
- Users can provide feedback on response quality (helpful/not helpful)
- Feedback is automatically tracked for admin review

### 2. Admin Feedback Queue
- View all user questions and feedback in a centralized dashboard
- Filter by status (pending, reviewed, resolved, archived)
- Filter by priority (high, medium, low)
- Assign feedback items to team members for review
- Track resolution status

### 3. Chatbot Response Management
- Create and update chatbot response patterns
- Organize responses by category
- Set priority levels for pattern matching
- View performance statistics

### 4. Performance Analytics
- Track total chatbot messages
- Monitor helpful vs unhelpful response ratio
- View average response length
- See pending feedback count

## API Endpoints

### User Endpoints

#### Save Chat Message
```
POST /api/chatbot/messages
Authorization: Bearer <token>

Body:
{
  "userQuestion": "What should I do in case of an earthquake?",
  "botResponse": "In case of an earthquake, follow these steps...",
  "context": {
    "category": "natural_disaster",
    "intent": "emergency_procedure"
  }
}

Response:
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

#### Submit Feedback
```
POST /api/chatbot/messages/:id/feedback
Authorization: Bearer <token>

Body:
{
  "isHelpful": false,
  "feedbackText": "The response didn't address my specific situation"
}

Response:
{
  "id": "uuid",
  "isHelpful": false,
  "feedbackText": "...",
  "feedbackProvidedAt": "2026-06-01T..."
}
```

#### Get Chat History
```
GET /api/chatbot/history?limit=50&offset=0
Authorization: Bearer <token>

Response:
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

### Admin Endpoints

#### Get Feedback Queue
```
GET /api/chatbot/admin/feedback-queue?status=pending&priority=high&limit=50&offset=0
Authorization: Bearer <admin-token>

Response:
{
  "items": [
    {
      "id": "uuid",
      "chatMessageId": "uuid",
      "organizationId": "uuid",
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

#### Get Specific Feedback Item
```
GET /api/chatbot/admin/feedback-queue/:id
Authorization: Bearer <admin-token>

Response:
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

#### Update Feedback Item
```
PATCH /api/chatbot/admin/feedback-queue/:id
Authorization: Bearer <admin-token>

Body:
{
  "status": "reviewed",
  "adminAction": "Assigned to team for response improvement",
  "assignedTo": "user-uuid"
}

Response:
{
  "id": "uuid",
  "status": "reviewed",
  "assignedTo": "user-uuid",
  "reviewedAt": "2026-06-01T..."
}
```

#### Resolve Feedback Item
```
POST /api/chatbot/admin/feedback-queue/:id/resolve
Authorization: Bearer <admin-token>

Body:
{
  "adminAction": "Updated chatbot response pattern to address this question",
  "updatedResponseId": "response-uuid"
}

Response:
{
  "id": "uuid",
  "status": "resolved",
  "resolvedAt": "2026-06-01T...",
  "adminAction": "..."
}
```

#### Create/Update Chatbot Response
```
POST /api/chatbot/admin/responses
Authorization: Bearer <admin-token>

Body:
{
  "questionPattern": "evacuation|emergency exit|leave building",
  "response": "In case of emergency evacuation: 1. Proceed to nearest exit... 2. Follow floor marshals... 3. Assemble at designated meeting point",
  "category": "work_protocol",
  "priority": 10
}

Response:
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

#### Get Chatbot Responses
```
GET /api/chatbot/admin/responses?category=work_protocol&limit=100&offset=0
Authorization: Bearer <admin-token>

Response:
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

#### Get Chatbot Statistics
```
GET /api/chatbot/admin/stats
Authorization: Bearer <admin-token>

Response:
{
  "totalMessages": 1250,
  "helpfulMessages": 1050,
  "unhelpfulMessages": 200,
  "helpfulPercentage": 84,
  "pendingFeedback": 15,
  "averageResponseLength": 245
}
```

## Database Schema

### chat_messages
Stores all chatbot conversations with user feedback.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  user_question TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  context JSONB,
  is_helpful BOOLEAN,
  feedback_text TEXT,
  feedback_provided_at TIMESTAMP,
  status VARCHAR(50),
  admin_notes TEXT,
  updated_response TEXT,
  updated_by UUID,
  updated_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### chatbot_responses
Stores trained response patterns for the chatbot.

```sql
CREATE TABLE chatbot_responses (
  id UUID PRIMARY KEY,
  organization_id UUID,
  question_pattern VARCHAR(500) NOT NULL,
  response TEXT NOT NULL,
  category VARCHAR(100),
  priority INT,
  is_active BOOLEAN,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### chatbot_feedback_queue
Admin todo list for improving chatbot responses.

```sql
CREATE TABLE chatbot_feedback_queue (
  id UUID PRIMARY KEY,
  chat_message_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  user_question TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  user_feedback TEXT,
  is_helpful BOOLEAN,
  priority VARCHAR(50),
  status VARCHAR(50),
  assigned_to UUID,
  reviewed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  admin_action TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Admin Dashboard Workflow

### 1. Review Feedback Queue
1. Navigate to Admin Dashboard → Chatbot Feedback
2. View pending feedback items sorted by priority
3. Click on an item to see full details

### 2. Analyze User Questions
- Read the user's question
- Review the bot's original response
- Read user's feedback explaining why it wasn't helpful

### 3. Take Action
Choose one of these actions:

**Option A: Update Response Pattern**
1. Click "Update Response"
2. Modify the chatbot response pattern
3. Save changes
4. Mark as "resolved"

**Option B: Create New Pattern**
1. Click "Create New Pattern"
2. Enter question pattern (use | for alternatives)
3. Write improved response
4. Set category and priority
5. Save and mark feedback as "resolved"

**Option C: Assign for Review**
1. Click "Assign"
2. Select team member
3. Add notes
4. Mark as "reviewed"

**Option D: Archive**
1. If not actionable, mark as "archived"
2. Add reason in admin notes

### 4. Monitor Performance
- Check dashboard statistics regularly
- Track helpful percentage trend
- Identify common question patterns
- Prioritize high-impact improvements

## Best Practices

### Response Pattern Creation
- Use pipe (|) to separate alternative question patterns
- Keep patterns concise and specific
- Test patterns with real user questions
- Set appropriate priority levels

Example:
```
"evacuation|emergency exit|leave building|emergency procedure"
```

### Response Writing
- Be clear and actionable
- Include step-by-step instructions when applicable
- Keep responses concise but complete
- Use formatting for readability

### Feedback Management
- Review feedback daily
- Prioritize high-priority items
- Track resolution time
- Monitor improvement trends

### Categories
- `natural_disaster` - Earthquake, flood, hurricane, etc.
- `hr_protocol` - HR policies, benefits, procedures
- `work_protocol` - Workplace safety, procedures
- `emergency_procedure` - Emergency response steps
- `general` - General information

## Performance Metrics

### Key Metrics to Monitor
- **Helpful Percentage**: Target 85%+
- **Response Time**: Average response length
- **Pending Feedback**: Keep below 20 items
- **Resolution Rate**: Resolve 90%+ of feedback

### Improvement Tracking
- Track helpful percentage over time
- Monitor most common questions
- Identify patterns in unhelpful responses
- Measure impact of response updates

## Troubleshooting

### Low Helpful Percentage
1. Review recent unhelpful feedback
2. Identify common issues
3. Update response patterns
4. Test with sample questions

### High Pending Feedback
1. Assign items to team members
2. Prioritize high-priority items
3. Set review schedule
4. Archive non-actionable items

### Missing Responses
1. Check if pattern exists
2. Verify pattern syntax
3. Check priority levels
4. Create new pattern if needed

## Integration with Frontend

The frontend admin dashboard will display:
- Feedback queue with filtering and sorting
- Detailed feedback item view
- Response pattern editor
- Performance statistics dashboard
- Action buttons for common tasks

## Future Enhancements

- Machine learning for automatic pattern suggestions
- A/B testing for response variations
- Sentiment analysis for feedback
- Automated response quality scoring
- Integration with knowledge base
- Multi-language support
