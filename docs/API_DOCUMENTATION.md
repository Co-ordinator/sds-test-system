# API Documentation - SDS Test System

## Base URL
**Development:** `http://localhost:5000/api/v1`  
**Production:** `https://api.sds-test.gov.sz/api/v1`

## Authentication

All endpoints (except public routes) require JWT authentication via:
```
Authorization: Bearer <token>
```

### Public Endpoints (No Auth Required)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/verify-email/:token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password/:token`
- `GET /api/v1/institutions` (public list for registration)
- `GET /api/v1/institutions/search?q=` (public fuzzy search for institutions)
- `GET /api/v1/occupations/search?q=` (public fuzzy search for occupations)

### Role-Based Access Control (RBAC)

**Roles:**
- `System Administrator` - Full system access (49 permissions)
- `Test Administrator` - Manage test takers, view results (16 default permissions)
- `Test Taker` - Take assessments, view own results

**User Types:**
- `High School Student`
- `University Student`
- `Professional`
- `Test Administrator`
- `System Administrator`

### Permission System

Granular permissions across 13 modules (49 total permissions):
- **users**: view, create, update, delete, export
- **institutions**: view, create, update, delete, export, import
- **questions**: view, create, update, delete, import, export
- **occupations**: view, create, update, delete, import, export
- **subjects**: view, create, update, delete, import, export
- **assessments**: view, create, update, delete, export
- **results**: view, export
- **analytics**: view, export
- **audit**: view
- **notifications**: view, manage
- **certificates**: view, generate, download
- **permissions**: view, manage
- **test_takers**: manage

## Endpoints

### Authentication (`/api/v1/auth`)

**Public Routes:**
```
POST   /register                    Register new user
POST   /login                       User login (email/username/studentNumber)
GET    /verify-email/:token         Verify email address
POST   /resend-verification         Resend verification email
POST   /forgot-password             Request password reset
POST   /reset-password/:token       Reset password with token
POST   /refresh-token               Refresh access token
```

**Authenticated Routes:**
```
GET    /me                          Get current user profile
PATCH  /me                          Update current user profile
PATCH  /users/me                    Update profile (alias)
POST   /change-password             Change password (requires current password)
POST   /logout                      Logout user
GET    /users/me/export             Export all user data (GDPR)
DELETE /users/me/account            Delete user account (GDPR)
```

### Assessments (`/api/v1/assessments`)

**All routes require authentication. Test-taking routes restricted to Test Taker role.**

```
POST   /                            Start new assessment (Test Taker only)
GET    /                            List my assessments (Test Taker only)
GET    /questions                   Get all questions (Test Taker only)
GET    /:assessmentId               Get assessment details (Test Taker only)
GET    /:assessmentId/progress      Get assessment progress (Test Taker only)
POST   /:assessmentId/progress      Save progress (Test Taker only)
POST   /:assessmentId/complete      Submit assessment (Test Taker only)
GET    /:assessmentId/results       Get results (any authenticated user)
GET    /:assessmentId/pdf           Download results PDF (any authenticated user)
```

**Certificate Endpoints:**
```
GET    /:assessmentId/certificate/check      Check if certificate exists
GET    /:assessmentId/certificate/download   Download certificate PDF
GET    /my/certificates                      List my certificates
```

### Results (`/api/v1/results`)

```
GET    /:assessmentId              Get test results
GET    /:assessmentId/pdf          Download results PDF
```

### Admin (`/api/v1/admin`)

**All routes require System Administrator or Test Administrator role + specific permissions.**

**User Management:**
```
GET    /users                       List all users (users.view)
GET    /users/:id                   Get user details (users.view)
POST   /users                       Create user (users.create)
PATCH  /users/:id                   Update user (users.update)
DELETE /users/:id                   Delete user (users.delete, no self-deletion)
POST   /users/bulk-delete           Bulk delete users (users.delete, self-deletion prevented)
POST   /users/bulk-update           Bulk activate/deactivate users (users.update)
PATCH  /users/:id/permissions       Update user permissions (permissions.manage)
```

**Permission Management:**
```
GET    /permissions                 List all permissions (permissions.view)
GET    /permissions/user/:id        Get user permissions (permissions.view)
```

**Question Bank:**
```
GET    /questions                   List questions (questions.view)
POST   /questions                   Create question (questions.create)
PATCH  /questions/:id               Update question (questions.update)
DELETE /questions/:id               Delete question (questions.delete)
POST   /questions/bulk-delete        Bulk delete questions (questions.delete)
POST   /questions/import            Import questions CSV/JSON (questions.import)
GET    /questions/export            Export questions (questions.export)
```

**Occupation Management:**
```
GET    /occupations                 List occupations (occupations.view)
POST   /occupations                 Create occupation (occupations.create)
PATCH  /occupations/:id             Update occupation (occupations.update)
PATCH  /occupations/:id/review      Review/approve pending occupation (occupations.update)
DELETE /occupations/:id             Delete occupation (occupations.delete)
POST   /occupations/bulk-delete      Bulk delete occupations (occupations.delete)
POST   /occupations/bulk-approve     Bulk approve pending occupations (occupations.update)
POST   /occupations/import          Import occupations CSV (occupations.import)
GET    /occupations/export          Export occupations (occupations.export)
```

**Subject Management:**
```
GET    /subjects                    List subjects (subjects.view)
POST   /subjects                    Create subject (subjects.create)
PATCH  /subjects/:id                Update subject (subjects.update)
DELETE /subjects/:id                Delete subject (subjects.delete)
POST   /subjects/import             Import subjects CSV (subjects.import)
GET    /subjects/export             Export subjects (subjects.export)
```

**Analytics:**
```
GET    /analytics                   System analytics (analytics.view)
GET    /analytics/institutions      Institution analytics (analytics.view)
GET    /analytics/holland-distribution  Holland code distribution (analytics.view)
GET    /analytics/trend             Assessment trend data (analytics.view)
GET    /analytics/regional          Regional analytics (analytics.view)
GET    /analytics/knowledge-graph   Knowledge graph data (analytics.view)
GET    /analytics/segmentation      Segmentation analytics (analytics.view)
GET    /analytics/skills-pipeline   Skills pipeline data (analytics.view)
GET    /analytics/export            Export analytics (analytics.export)
```

**Assessments (Admin View):**
```
GET    /assessments                 List all assessments (assessments.view)
```

**Data Export:**
```
GET    /export/users                Export users CSV (users.export)
GET    /export/assessments          Export assessments CSV (assessments.export)
```

**Notifications:**
```
GET    /notifications               List notifications (notifications.view)
PATCH  /notifications/:id/read      Mark notification read (notifications.manage)
POST   /notifications/mark-all-read Mark all read (notifications.manage)
```

**Certificates:**
```
GET    /certificates                List certificates (certificates.view)
POST   /certificates/:assessmentId/generate  Generate certificate (certificates.generate)
GET    /certificates/:assessmentId/download  Download certificate (certificates.download)
```

**Audit Logs:**
```
GET    /audit-logs                  List audit logs (audit.view)
GET    /audit-logs/:id              Get audit log details (audit.view)
```

**Institution Management (`/api/v1/institutions`):**
```
GET    /                            List all institutions (public)
GET    /search?q=                   Search institutions by name (public, iLike, max 20)
POST   /                            Create institution (System/Test Administrator)
PATCH  /:id                         Update institution (System/Test Administrator)
PATCH  /:id/review                  Review/approve pending institution (System/Test Administrator)
DELETE /:id                         Delete institution (System/Test Administrator)
POST   /bulk-delete                  Bulk delete institutions (System/Test Administrator)
POST   /bulk-approve                 Bulk approve pending institutions (System/Test Administrator)
GET    /export                      Export institutions CSV (System/Test Administrator)
POST   /import                      Import institutions CSV (System/Test Administrator)
```

**Occupation Search (`/api/v1/occupations`):**
```
GET    /search?q=                   Search occupations by name/category (public, iLike, max 20)
```

### Test Administrator/Counselor (`/api/v1/counselor`)

**All routes require Test Administrator or System Administrator role.**

```
GET    /students                    List my students (test_takers.manage)
GET    /institution-stats           Get institution statistics (test_takers.manage)
POST   /students/import             Import students CSV (test_takers.manage)
DELETE /students/:studentId          Delete student (test_takers.manage)
PATCH  /students/:studentId          Update student (test_takers.manage)
GET    /students/:studentId/results  Get student results (test_takers.manage)
GET    /login-cards                 Generate login cards PDF (test_takers.manage)
```

**Student Import CSV Format:**
```csv
student_number,first_name,last_name,grade,class,gender,email
20250101,Thabo,Zwane,Form 5,5A,male,
20250102,Nomsa,Dlamini,Form 5,5A,female,nomsa@example.com
```

### Institutions (`/api/v1/institutions`)

```
GET    /                            List institutions (public)
POST   /                            Create institution (admin only)
PATCH  /:id                         Update institution (admin only)
DELETE /:id                         Delete institution (admin only)
GET    /export                      Export institutions (admin only)
POST   /import                      Import institutions CSV (admin only)
```

---

## Request/Response Examples

### Registration

**Request (Simplified - v2.2.0):**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "nationalId": "0312150123456",
  "email": "student@example.com",
  "password": "SecurePass@123",
  "consent": true
}
```

**Required Fields:**
- `nationalId` (string, 13 digits) - Eswatini National ID number
- `email` (string, valid email) - User's email address
- `password` (string, min 8 chars, letters + numbers) - Account password
- `consent` (boolean, must be true) - Data processing consent

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "uuid",
      "nationalId": "0312150123456",
      "email": "student@example.com",
      "firstName": "Pending",
      "lastName": "Onboarding",
      "dateOfBirth": "2003-12-15",
      "gender": "female",
      "role": "Test Taker",
      "studentCode": "SDS-2026-001234",
      "isEmailVerified": false,
      "isConsentGiven": true
    }
  }
}
```

**Notes:**
- Date of birth and gender are automatically extracted from National ID
- User type and other profile details collected during onboarding flow
- Returns JWT token for immediate authentication
- Email verification required before taking assessments
- National ID must be unique (returns 409 Conflict if duplicate)

**Error Responses:**

*Duplicate National ID (409):*
```json
{
  "status": "error",
  "message": "An account with this National ID already exists. Please login instead."
}
```

*Invalid National ID Format (400):*
```json
{
  "status": "error",
  "message": "National ID must be exactly 13 digits"
}
```

### Login

**Request (supports email, username, or studentNumber):**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "student@example.com",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "Thabo",
      "lastName": "Dlamini",
      "role": "Test Taker",
      "userType": "High School Student",
      "permissions": []
    }
  }
}
```

### Start Assessment

**Request:**
```http
POST /api/v1/assessments
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "id": "uuid",
      "userId": "uuid",
      "status": "in_progress",
      "progress": 0,
      "createdAt": "2026-03-12T10:00:00Z"
    }
  }
}
```

### Save Progress

**Request:**
```http
POST /api/v1/assessments/:assessmentId/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "uuid",
      "value": "YES",
      "section": "activities",
      "riasecType": "R"
    },
    {
      "questionId": "uuid",
      "value": "NO",
      "section": "activities",
      "riasecType": "I"
    }
  ]
}
```

### Get Results

**Response:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "id": "uuid",
      "status": "completed",
      "hollandCode": "SAE",
      "scoreR": 35,
      "scoreI": 28,
      "scoreA": 42,
      "scoreS": 45,
      "scoreE": 38,
      "scoreC": 30,
      "completedAt": "2026-03-12T11:30:00Z"
    },
    "recommendations": {
      "occupations": [
        {
          "id": "uuid",
          "name": "Teacher",
          "code": "SAE",
          "localDemand": "high",
          "educationRequired": "Bachelor's Degree"
        }
      ],
      "courses": [
        {
          "id": "uuid",
          "name": "Bachelor of Education",
          "qualificationType": "bachelor",
          "durationYears": 4,
          "institutions": ["UNESWA", "SANU"]
        }
      ],
      "suggestedSubjects": ["English", "Mathematics", "Psychology"],
      "hollandCode": "SAE",
      "educationLevel": "Level 3"
    }
  }
}
```

### Import Students (CSV)

**Request:**
```http
POST /api/v1/counselor/students/import
Authorization: Bearer <token>
Content-Type: text/csv

student_number,first_name,last_name,grade,class,gender,email
20250101,Thabo,Zwane,Form 5,5A,male,
20250102,Nomsa,Dlamini,Form 5,5A,female,nomsa@example.com
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully imported 2 students",
  "data": {
    "imported": 2,
    "credentials": [
      {
        "username": "20250101",
        "password": "generated_password",
        "studentNumber": "20250101",
        "name": "Thabo Zwane"
      }
    ]
  }
}
```

### Create User (Admin)

**Request:**
```http
POST /api/v1/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "testadmin@school.sz",
  "password": "TempPass@123",
  "firstName": "Nomvula",
  "lastName": "Nkosi",
  "role": "Test Administrator",
  "userType": "Test Administrator",
  "institutionId": "uuid",
  "mustChangePassword": true
}
```

### Update User Permissions

**Request:**
```http
PATCH /api/v1/admin/users/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": [
    "users.view",
    "test_takers.manage",
    "assessments.view",
    "results.view"
  ]
}
```

### Query Parameters

**List Users:**
```
GET /api/v1/admin/users?role=Test Taker&educationLevel=3&search=John
```

**List Questions:**
```
GET /api/v1/admin/questions?section=activities&riasecType=R
```

**Analytics with Filters:**
```
GET /api/v1/admin/analytics?institutionId=uuid&region=manzini&startDate=2026-01-01&endDate=2026-03-31
```

### Data Subject Rights (GDPR)

**Export User Data:**
```http
GET /api/v1/auth/users/me/export
Authorization: Bearer <token>
```

**Response:** JSON file with all user data including:
- Profile information
- Assessment history and responses
- Results and recommendations
- Audit logs

**Delete Account:**
```http
DELETE /api/v1/auth/users/me/account
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Account successfully deleted"
}
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
  "nationalId": "9202201234567",
  "userType": "High School Student",
  "region": "manzini",
  "consent": true
}
// Note: role defaults to "Test Taker" for public registration
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

---

## Error Responses

### Standard Error Format

```json
{
  "status": "error",
  "message": "Human-readable error message"
}
```

### Common Error Codes

**400 Bad Request - Validation Error:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "Invalid token"
}
```

**403 Forbidden - Permission Denied:**
```json
{
  "status": "error",
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "status": "error",
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "message": "An internal server error occurred"
}
```

---

## File Upload Formats

### CSV Import Requirements

**Questions Import:**
- Content-Type: `text/csv`
- Max size: 10MB
- Headers: `text,section,riasec_type,order,question_code`

**Occupations Import:**
- Content-Type: `text/csv`
- Max size: 10MB
- Headers: `code,name,holland_codes,description,education_level,local_demand`

**Students Import:**
- Content-Type: `text/csv`
- Max size: 10MB
- Headers: `student_number,first_name,last_name,grade,class,gender,email`

**Subjects Import:**
- Content-Type: `text/csv`
- Max size: 5MB
- Headers: `name,riasec_codes,description,level`

---

## Versioning

**Current version:** `v1`  
**API Prefix:** `/api/v1`

---

## Support

**Technical Team:**
- Technical Lead: Thokozani Ginindza
- Lead Developer: Nkhosini Gwebu
- Project Admin: Sibusiso Baartjies

**Ministry of Labour and Social Security**  
Measurement and Testing Unit  
P.O. Box 198, Mbabane H100  
Kingdom of Eswatini  
Tel: +268 4041971/2/3

---

**Version:** 2.0  
**Last Updated:** March 2026  
**Ministry of Labour and Social Security - Kingdom of Eswatini**
