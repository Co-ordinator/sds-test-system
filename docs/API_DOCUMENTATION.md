# API Documentation - SDS Test System

## Base URL
`https://api.sds-test.gov.sz/api/v1`

## Authentication
All endpoints (except `/auth/*`) require JWT authentication via:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication
```
POST   /auth/register      Register new user
POST   /auth/login         User login
POST   /auth/forgot-password  Request password reset
POST   /auth/reset-password   Reset password
GET    /auth/me            Get current user profile
```

### Tests
```
GET    /tests              List available tests
GET    /tests/:id          Get test details
GET    /tests/:id/sections List test sections
GET    /tests/:id/sections/:sectionId/questions  List section questions
```

### Test Attempts
```
POST   /attempts           Start new test attempt
GET    /attempts/:id       Get attempt details
PATCH  /attempts/:id       Update attempt progress
POST   /attempts/:id/responses  Submit answers
POST   /attempts/:id/complete   Complete attempt
```

### Results
```
GET    /results/:attemptId  Get test results
GET    /results/:attemptId/report  Get PDF report
GET    /results/:attemptId/recommendations  Get career recommendations
```

### Admin
```
GET    /admin/users        List all users
GET    /admin/analytics    Get system analytics
GET    /admin/audit-logs   View audit logs
```

## Logging System

The API uses Winston for unified logging with:

- **Console logging** (development)
- **File logging** (rotated daily)
- **Database audit logs** (for security-sensitive actions)

### Logging Levels
- `error` (0) - Critical failures
- `warn` (1) - Suspicious/security events
- `info` (2) - Audit-worthy actions
- `http` (3) - Request logging
- `debug` (4) - Development details

### Audit Log Fields
```json
{
  "userId": "UUID",
  "actionType": "ENUM(LOGIN|REGISTER|...)",
  "description": "Human-readable summary",
  "details": {"key": "value"},
  "ipAddress": "Request IP",
  "userAgent": "Client browser/device"
}
```

### Example Controller Usage
```javascript
// Standard system log
logger.info('Server started on port 5000');

// Audit log with request metadata
logger.info({
  actionType: 'LOGIN',
  message: 'User logged in',
  req: requestObject,
  details: { userId: user.id }
});
```

## Database Initialization

- **setup.js**: One-time database setup script
  - Destructive reset (`force: true`)
  - Full data seeding
  - Includes test accounts
  - Run via: `npm run setup`

- **setupDatabase.js**: Runtime initialization
  - Non-destructive sync (`alter: true`)
  - No automatic seeding
  - Called automatically on app start

## Examples

### Register User
```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "region": "manzini"
}
```

### Submit Test Response
```json
POST /attempts/:id/responses
{
  "questionId": "abc123",
  "responseValue": "YES",
  "timeSpent": 15
}
```

## Error Responses

```json
{
  "status": "error",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-01-26T10:18:00Z"
}
```

## Rate Limiting
- 100 requests/minute per IP
- Authentication exempt

## Versioning
Current version: `v1`

## Support
For API issues, contact: api-support@labor.gov.sz
