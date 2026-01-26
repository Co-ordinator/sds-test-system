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
POST   /auth/refresh-token Refresh access token
POST   /auth/logout        Logout user
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
GET    /admin/questions                 List questions (filters: section, riasecType)
POST   /admin/questions                 Create question
PATCH  /admin/questions/:id             Update question
DELETE /admin/questions/:id             Delete question
POST   /admin/questions/import          Import questions (JSON or CSV)
GET    /admin/questions/export          Export questions (JSON or CSV via ?format=csv)
```

**Question payload fields**
- `text` (string, required)
- `section` (enum: activities | competencies | occupations | self_estimates)
- `riasecType` (enum: R, I, A, S, E, C)
- `order` (integer, >0)

**Import (JSON)**
```json
POST /admin/questions/import
{
  "questions": [
    { "text": "I like building things", "section": "activities", "riasecType": "R", "order": 1 },
    { "text": "I enjoy solving puzzles", "section": "activities", "riasecType": "I", "order": 2 }
  ]
}
```

**Import (CSV)**
- Content-Type: `text/csv`
- Required headers: `text,section,riasec_type,order`
- Example:
```
text,section,riasec_type,order
I like building things,activities,R,1
I enjoy solving puzzles,activities,I,2
```

**Export**
- `GET /admin/questions/export` returns JSON list
- `GET /admin/questions/export?format=csv` downloads CSV

### Data Subject Rights
```
GET    /auth/users/me/export   Export all user data (Right to Access)
DELETE /auth/users/me/account  Delete user account (Right to Erasure)
```

**Data Export Response**
Returns JSON file with all user data including:
- Profile information
- Test attempts and responses
- Results and recommendations
- Audit logs

**Account Deletion**
- Permanently deletes user account and all associated data
- Uses cascading deletes for related records
- Logs deletion action before execution

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

## National ID Processing
The system automatically extracts the following from valid 13-digit national IDs:
- **Date of Birth**: First 6 digits (YYMMDD)
  - Years are interpreted as:
    - YY > current year: 19YY
    - YY ≤ current year: 20YY
- **Gender**: Digits 7-10
  - 0000-4999: Female
  - 5000-9999: Male

This data populates the `dateOfBirth` and `gender` fields automatically during user creation/updates.

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

## Security
### Security Headers
All responses include secure HTTP headers via Helmet:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- XSS Protection
- Frame Options (deny)
- No Sniff MIME type
- DNS Prefetch Control

### Rate Limiting
- **Global Limiter**: 100 requests per 15 minutes per IP
- **Auth Limiter**: 5 requests per 15 minutes for `/auth/login` and `/auth/register`
- Responses include rate limit headers:
  - `X-RateLimit-Limit` - Total allowed requests
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Time until reset (UTC epoch seconds)
- On limit exceed:
  ```json
  {
    "status": "error",
    "message": "Too many requests from this IP, please try again after 15 minutes"
  }
  ```

## Error Handling

The API implements a global error handler that:

1. **In Production** (`NODE_ENV=production`):
   - Logs full error details to Winston/Audit Logs
   - Returns generic error response:
     ```json
     {
       "status": "error",
       "message": "An internal server error occurred"
     }
     ```

2. **In Development** (`NODE_ENV=development`):
   - Returns detailed error information for debugging:
     ```json
     {
       "status": "error",
       "message": "Error message",
       "stack": "Error stack trace",
       "error": {
         "name": "Error name",
         "details": "Additional error info"
       }
     }
     ```

3. **Controller Implementation**:
   - All async controller methods must wrap logic in try-catch
   - Errors should be passed to `next(err)` to trigger the handler
   - Example:
     ```javascript
     try {
       // Controller logic
     } catch (error) {
       next(error);
     }
     ```

## Examples

### Register User
```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "nationalId": "9202201234567", // 13 digits
  "role": "user",
  "region": "manzini",
  "consent": true
}
```

**Note**: The `dateOfBirth` and `gender` fields are automatically derived from the `nationalId` and do not need to be provided.

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

**National ID Errors**
```json
{
  "status": "error",
  "message": "Invalid National ID format",
  "code": "NATIONAL_ID_INVALID",
  "timestamp": "2026-01-26T10:18:00Z"
}
```

**Validation Errors**
```json
{
  "status": "error",
  "message": "Detailed error message",
  "code": "VALIDATION_ERROR",
  "timestamp": "2026-01-26T10:18:00Z"
}
```

## Versioning
Current version: `v1`

## Support
For API issues, contact: api-support@labor.gov.sz
