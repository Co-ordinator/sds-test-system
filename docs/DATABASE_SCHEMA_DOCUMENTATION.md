# SDS Test System - Database Schema Documentation

## Overview

The Online Self-Directed Search (SDS) Test System database is designed to support Holland's RIASEC career assessment model for the Ministry of Labour and Social Security of Eswatini.

### Key Features
- **RIASEC Model Implementation** - Full support for Realistic, Investigative, Artistic, Social, Enterprising, and Conventional assessment
- **Multi-language Support** - English and siSwati
- **Comprehensive Audit Trail** - Complete logging for compliance
- **Data Protection Compliant** - Aligned with Eswatini Data Protection Act 2022
- **Role-Based Access Control** - System Administrator, Test Administrator, Test Taker roles with 49 granular permissions
- **Scalable Architecture** - Supports 500+ concurrent users
- **Career Resources Integration** - Links to local institutions and opportunities

---

## Database Tables

### 1. User Management

#### **users**
Stores all system users (test takers, test administrators, system administrators)

**Key Fields:**
- `id` (UUID) - Primary key
- `username` (string, unique, nullable)
- `email` (string, unique, nullable) - Unique email address
- `password` (string) - Bcrypt hashed password (10 rounds)
- `firstName`, `lastName` (string) - User names
- `nationalId` (string, 13 digits, unique, nullable) - Eswatini National ID (auto-extracts DOB & gender)
- `dateOfBirth` (DATEONLY, nullable) - Auto-populated from nationalId
- `gender` (ENUM: `male` | `female` | `other` | `prefer_not_to_say`, nullable)
- `phoneNumber` (string, nullable)

**Role & Access:**
- `role` (ENUM) - `System Administrator` | `Test Administrator` | `Test Taker`
- `userType` (ENUM, nullable) - `High School Student` | `University Student` | `Professional` | `Test Administrator` | `System Administrator`
- `isActive` (boolean, default: true)
- `isEmailVerified` (boolean, default: false)
- `createdByTestAdministrator` (boolean, default: false)
- `mustChangePassword` (boolean, default: false)

**Location:**
- `region` (ENUM, nullable) - `hhohho` | `manzini` | `lubombo` | `shiselweni`
- `district` (string, nullable)
- `address` (text, nullable)

**Education & Employment:**
- `educationLevel` (UUID, nullable) - FK → education_levels.id
- `currentInstitution` (string, nullable)
- `gradeLevel` (string, nullable)
- `institutionId` (UUID, nullable) - FK → institutions.id
- `employmentStatus` (ENUM, nullable) - `student` | `employed` | `unemployed` | `self_employed` | `other`
- `currentOccupation` (string, nullable) - Free-text occupation name (kept in sync with linked record)
- `currentOccupationId` (UUID, FK → occupations.id, nullable) - Linked occupation record

**Extended User Journey Fields:**
- `studentNumber` (string, unique, nullable)
- `className` (string, nullable)
- `studentCode` (string, unique, nullable)
- `degreeProgram` (string, nullable) - For university students
- `yearOfStudy` (integer, nullable) - For university students
- `yearsExperience` (integer, nullable) - For professionals
- `workplaceInstitutionId` (UUID, FK → institutions, nullable) - Linked workplace institution for professionals
- `workplaceName` (string, nullable) - Free-text workplace name for professionals (used when not matched to an institution)
- `testAdministratorCode` (string, unique, nullable)
- `organization` (string, nullable)

**Preferences & Accessibility:**
- `preferredLanguage` (ENUM, default: `en`) - `en` | `ss` (English/siSwati)
- `requiresAccessibility` (boolean, default: false)
- `accessibilityNeeds` (JSONB, default: {}) - WCAG compliance data

**Consent & Privacy:**
- `isConsentGiven` (boolean, default: false)
- `consentDate` (DATE, nullable)

**Security & Tokens:**
- `lastLogin` (DATE, nullable)
- `emailVerificationToken` (string, nullable)
- `emailVerificationExpires` (DATE, nullable)
- `passwordResetToken` (string, nullable)
- `passwordResetExpires` (DATE, nullable)
- `refreshToken` (string, nullable)
- `refreshTokenExpires` (DATE, nullable)

**Timestamps:**
- `createdAt`, `updatedAt` (auto-managed)

**Indexes:**
- username (unique), email (unique), national_id (unique), student_number (unique), student_code (unique), institution_id, workplace_institution_id, role, user_type, education_level, is_active, is_email_verified

**Security Features:**
- Password hashing via bcrypt (10 rounds) - automatic on create/update
- National ID parsing (auto-extracts DOB & gender)
- Password reset tokens with expiration
- Email verification workflow
- Last login tracking
- Refresh token rotation

**Model Hooks:**
- `beforeCreate`: Hash password, parse nationalId
- `beforeUpdate`: Hash password if changed, parse nationalId if changed
- `toJSON`: Strips sensitive fields (password, tokens)

#### **user_qualifications**
Academic certificates and qualification documents uploaded by users.

**Key Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID, FK → users, CASCADE delete) - Document owner
- `title` (string, required) - Document title e.g. "IGCSE Certificate 2022"
- `documentType` (ENUM, default: `certificate`) - `certificate` | `degree` | `diploma` | `transcript` | `professional_licence` | `other`
- `issuedBy` (string, nullable) - Issuing institution name
- `issueDate` (DATEONLY, nullable) - Date the document was issued
- `fileName` (string) - Original uploaded filename
- `filePath` (string) - Absolute server path to stored file (`backend/uploads/qualifications/`)
- `fileSize` (integer) - File size in bytes (max 5 MB enforced)
- `mimeType` (string) - MIME type: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`

**Indexes:** user_id

**Notes:**
- Files stored at `backend/uploads/qualifications/` with randomised filenames
- Files are deleted from disk when the record is deleted
- Upload endpoint enforces 5 MB limit and allowed MIME types via multer

---

#### **permissions**
Granular permission system (49 permissions across 13 modules)

**Key Fields:**
- `id` (UUID) - Primary key
- `code` (string, unique) - Permission code (e.g., `users.create`, `analytics.view`)
- `name` (string) - Human-readable name
- `description` (string, nullable) - Permission description
- `module` (string) - Module grouping (users, institutions, questions, occupations, subjects, assessments, results, analytics, audit, notifications, certificates, permissions, test_takers)

**Timestamps:**
- `createdAt`, `updatedAt`

**Permission Modules:**
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

#### **user_permissions**
Many-to-many junction table linking users to permissions

**Key Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID) - FK → users.id
- `permissionId` (UUID) - FK → permissions.id

**Timestamps:**
- `createdAt`, `updatedAt`

---

### 2. Test Structure

#### **questions**
Individual assessment questions (228 questions from SDS booklet)

**Key Fields:**
- `id` (UUID) - Primary key
- `text` (TEXT) - Question text as seen in SDS booklet
- `section` (ENUM) - `activities` | `competencies` | `occupations` | `self_estimates`
- `riasecType` (ENUM) - `R` | `I` | `A` | `S` | `E` | `C`
- `order` (integer) - Display sequence (required)
- `questionCode` (string, nullable) - SDS question code (e.g., R1, I12, SR1)

**Timestamps:**
- `createdAt`, `updatedAt`

**Validation Notes:**
- `order` is required (no nulls)
- Maps to Sections I-IV of the SDS

**Associations:**
- hasMany → answers

---

### 3. Test Taking & Responses

#### **assessments**
Tracks each user's SDS assessment session

**Key Fields:**
- `id` (UUID) - Primary key
- `userId` - Test taker (FK → users.id)
- `status` - `in_progress` | `completed` | `expired`
- `progress` - Decimal percentage (0-100)
- `hollandCode` - 3-letter code (e.g., "RIA")
- `scoreR`, `scoreI`, `scoreA`, `scoreS`, `scoreE`, `scoreC` - Raw RIASEC totals
- `educationLevelAtTest` - Snapshot FK (→ education_levels.level)
- `completedAt` - Timestamp of completion
- `createdAt`, `updatedAt`

**Indexes:**
- user_id, status, completed_at, user_id+status, holland_code, created_at

**Validation Notes:**
- `status` must be one of: in_progress, completed, expired

#### **answers**
Individual responses per question in an assessment

**Key Fields:**
- `id` (UUID) - Primary key
- `assessmentId` - FK → assessments.id (cascade delete)
- `questionId` - FK → questions.id
- `value` - `YES` | `NO` | `1`-`6` (validated)
- `section` - `activities` | `competencies` | `occupations` | `self_estimates`
- `riasecType` - `R` | `I` | `A` | `S` | `E` | `C`
- `createdAt`, `updatedAt`

**Indexes:**
- assessment_id+question_id (unique)
- assessment_id, question_id, section, riasec_type, assessment_id+section

**Validation Notes:**
- `value` must be one of: YES, NO, 1, 2, 3, 4, 5, 6

---

### 4. Results & Scoring

RIASEC scoring is stored directly on **assessments**:
- Raw totals: `scoreR`, `scoreI`, `scoreA`, `scoreS`, `scoreE`, `scoreC`
- Holland code: `hollandCode` (3-letter)
- Completion timestamp: `completedAt`

Scoring derives from **answers** per section/riasecType; composite queries are optimized via indexes on section, riasec_type, and assessment_id combinations.

---

### 5. Career Resources

#### **occupations**
Career options mapped to RIASEC codes (300 occupations seeded)

**Key Fields:**
- `id` (UUID) - Primary key
- `code` (string(10), nullable) - Holland code (e.g., `RAC`, `SAE`); null for user-submitted occupations pending review
- `name` (string) - Occupation name
- `hollandCodes` (string[], nullable) - Array of matching Holland codes
- `primaryRiasec` (string, nullable) - Primary RIASEC letter
- `secondaryRiasec` (string, nullable) - Secondary RIASEC letter
- `description` (TEXT, nullable)
- `category` (string, nullable) - Career category
- `educationLevel` (UUID, nullable) - FK → education_levels.id
- `educationRequired` (string, nullable) - Text description
- `demandLevel` (ENUM, nullable) - `low` | `medium` | `high` | `very_high` | `critical`
- `localDemand` (ENUM, nullable) - `low` | `medium` | `high` | `critical`
- `availableInEswatini` (boolean, default: false)
- `skills` (string[], nullable) - Required skills array
- `status` (ENUM, default: `approved`) - `approved` | `pending_review` — user-submitted occupations start as pending
- `submittedBy` (UUID, FK → users.id, nullable) - User who submitted the occupation for review

**Timestamps:**
- `createdAt`, `updatedAt`

**Associations:**
- belongsTo → education_levels (via educationLevel)
- belongsTo → users (via submittedBy, as 'submitter')
- hasMany → users (via currentOccupationId)
- belongsToMany → courses (through occupation_courses, as 'courses')
- hasMany → occupation_courses

#### **courses**
Tertiary education courses/programs (25+ courses seeded)

**Key Fields:**
- `id` (UUID) - Primary key
- `name` (string) - Course name
- `nameSwati` (string, nullable) - siSwati name
- `qualificationType` (ENUM, default: `bachelor`) - `certificate` | `diploma` | `bachelor` | `honours` | `postgrad_diploma` | `masters` | `doctorate` | `short_course` | `tvet` | `other`
- `durationYears` (DECIMAL(3,1), nullable) - Duration in years
- `description` (TEXT, nullable)
- `riasecCodes` (string[], default: []) - Matching RIASEC codes
- `suggestedSubjects` (string[], default: []) - Recommended subjects
- `fieldOfStudy` (string, nullable)
- `isActive` (boolean, default: true)

**Timestamps:**
- `createdAt`, `updatedAt`

**Associations:**
- hasMany → course_requirements (cascade delete)
- belongsToMany → institutions (through course_institutions)
- hasMany → course_institutions
- belongsToMany → occupations (through occupation_courses, as 'occupations')
- hasMany → occupation_courses

#### **course_requirements**
Entry requirements for courses

**Key Fields:**
- `id` (UUID) - Primary key
- `courseId` (UUID) - FK → courses.id
- `subject` (string) - Required subject name
- `minimumGrade` (string) - Minimum grade required
- `isMandatory` (boolean, default: true)

**Timestamps:**
- `createdAt`, `updatedAt`

**Associations:**
- belongsTo → courses

#### **course_institutions**
Many-to-many junction linking courses to institutions

**Key Fields:**
- `id` (UUID) - Primary key
- `courseId` (UUID) - FK → courses.id
- `institutionId` (UUID) - FK → institutions.id
- `customRequirements` (JSONB, nullable) - Institution-specific requirements
- `applicationUrl` (string, nullable)
- `isActive` (boolean, default: true)

**Timestamps:**
- `createdAt`, `updatedAt`

**Associations:**
- belongsTo → courses
- belongsTo → institutions

#### **subjects**
High school and tertiary subjects with RIASEC mapping

**Key Fields:**
- `id` (UUID) - Primary key
- `name` (string, unique) - Subject name
- `riasecCodes` (string[], default: []) - Associated RIASEC codes
- `description` (TEXT, nullable)
- `level` (ENUM, default: `high_school`) - `high_school` | `tertiary` | `both`
- `isActive` (boolean, default: true)
- `displayOrder` (integer, default: 0)

**Timestamps:**
- `createdAt`, `updatedAt`

**Indexes:**
- is_active, level, display_order

**Validation:**
- RIASEC codes must be valid (R, I, A, S, E, C)

#### **school_students**
Extended profile for school students created by test administrators

**Key Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID, unique) - FK → users.id
- `institutionId` (UUID) - FK → institutions.id
- `studentNumber` (string) - Student number
- `grade` (string, nullable) - Grade/form level
- `className` (string, nullable) - Class name
- `academicYear` (integer, nullable)
- `loginCardPrinted` (boolean, default: false)
- `loginCardPrintedAt` (DATE, nullable)

**Timestamps:**
- `createdAt`, `updatedAt`

**Associations:**
- belongsTo → users
- belongsTo → institutions

#### **institutions**
Educational institutions in Eswatini (41 institutions seeded)

**Key Fields:**
- `id` (UUID) - Primary key
- `name` (string) - Institution name
- `nameSwati` (string, nullable) - siSwati name
- `acronym` (string, nullable) - Short name (e.g., UNESWA, SANU)
- `type` (ENUM, default: `other`) - `university` | `college` | `tvet` | `school` | `vocational` | `other`
- `region` (ENUM, nullable) - `hhohho` | `manzini` | `lubombo` | `shiselweni` | `multiple`
- `district` (string, nullable)
- `description` (TEXT, nullable)
- `descriptionSwati` (TEXT, nullable)
- `phoneNumber` (string, nullable)
- `email` (string, nullable)
- `website` (string, nullable)
- `accredited` (boolean, default: false)
- `bursariesAvailable` (boolean, default: false)
- `programs` (JSONB, nullable) - Program offerings: `[{ name, code, duration, riasecCodes }]`
- `facilities` (string[], nullable)
- `status` (ENUM, default: `approved`) - `approved` | `pending_review` — user-submitted institutions start as pending
- `submittedBy` (UUID, FK → users.id, nullable) - User who submitted the institution for review

**Timestamps:**
- `createdAt`, `updatedAt`

**Associations:**
- belongsTo → users (via submittedBy, as 'submitter')
- hasMany → users (via institutionId)
- hasMany → users (via workplaceInstitutionId, as 'workplace')
- belongsToMany → courses (through course_institutions)
- hasMany → course_institutions
- hasMany → school_students

#### **education_levels**
Lookup table for education level codes (Levels 1-5 from SDS Appendix)

**Key Fields:**
- `id` (UUID) - Primary key
- `level` (integer, unique) - Education level code (1-5)
- `description` (string) - Level description

**Timestamps:**
- `createdAt`, `updatedAt`

**Associations:**
- hasMany → occupations (via educationLevel)
- hasMany → users (via educationLevel)
- hasMany → assessments (via educationLevelAtTest)

#### **occupation_courses**
Many-to-many junction table linking occupations to relevant courses (career pathways)

**Key Fields:**
- `id` (UUID) - Primary key
- `occupationId` (UUID) - FK → occupations.id (cascade delete)
- `courseId` (UUID) - FK → courses.id (cascade delete)
- `relevanceScore` (DECIMAL(3,2), nullable) - Relevance score 0.00-1.00 indicating how well the course prepares for this occupation
- `isPrimaryPathway` (boolean, default: false) - Whether this is a primary/direct pathway to the occupation
- `notes` (TEXT, nullable) - Additional notes about this occupation-course relationship

**Timestamps:**
- `createdAt`, `updatedAt`

**Indexes:**
- occupation_id, course_id, occupation_id+course_id (unique), is_primary_pathway

**Associations:**
- belongsTo → occupations
- belongsTo → courses

---

### 6. Audit & Compliance

#### **audit_logs**
Comprehensive activity logging for compliance and security monitoring

**Key Fields:**
- `id` (UUID) - Primary key
- `userId` (UUID, nullable) - FK → users.id
- `actionType` (string, max 100 chars) - Action identifier
- `description` (string) - Human-readable summary
- `details` (JSONB, nullable) - Technical details/state changes
- `ipAddress` (string, nullable) - Client IP address
- `userAgent` (string, nullable) - Client browser/device

**Timestamps:**
- `createdAt`, `updatedAt`

**Indexes:**
- user_id, action_type, created_at

**Common Action Types:**
- **Authentication**: LOGIN, LOGOUT, REGISTER, PASSWORD_RESET, PASSWORD_CHANGE
- **Testing**: TEST_START, TEST_COMPLETE, ASSESSMENT_STARTED, ASSESSMENT_COMPLETED
- **Profile**: PROFILE_UPDATE, USER_CREATED, USER_UPDATED, USER_DELETED
- **Security**: ACCESS_DENIED, PERMISSION_DENIED, SUSPICIOUS_ACTIVITY
- **Admin**: ADMIN_ACTION, SYSTEM_UPDATE, PERMISSION_GRANTED, PERMISSION_REVOKED

**Logging Pattern:**
```javascript
logger.info({
  actionType: 'LOGIN',
  message: 'User logged in',
  req: requestObject,
  details: { userId: 'abc123' }
});
```

**Associations:**
- belongsTo → users

#### **certificates**
Generated certificates for completed assessments

**Key Fields:**
- `id` (UUID) - Primary key
- `assessmentId` (UUID, unique) - FK → assessments.id
- `userId` (UUID) - FK → users.id
- `generatedBy` (UUID, nullable) - User who generated the certificate
- `generatedAt` (DATE, default: NOW)
- `certNumber` (string, max 50, nullable) - Certificate number

**Timestamps:**
- `createdAt`, `updatedAt`

**Indexes:**
- assessment_id (unique), user_id, generated_at

**Associations:**
- belongsTo → assessments
- belongsTo → users

---

## Relationships

### One-to-Many
- User → Assessments (user can take multiple assessments)
- User → AuditLogs (user activity tracking)
- Assessment → Answers (assessment has many answers, cascade delete)
- Question → Answers (question can have many responses)
- Institution → Users (optional affiliation via institutionId)
- Institution → Users (workplace affiliation via workplaceInstitutionId)
- Institution → SchoolStudents (school enrollment)
- EducationLevel → Users (via educationLevel)
- EducationLevel → Occupations (via educationLevel)
- EducationLevel → Assessments (via educationLevelAtTest - historical snapshot)
- Occupation → Users (via currentOccupationId - current occupation tracking)
- Course → CourseRequirements (entry requirements, cascade delete)
- Course → CourseInstitutions (where course is offered)
- Course → OccupationCourses (career pathways)
- Institution → CourseInstitutions (courses offered)
- Occupation → OccupationCourses (career pathways)

### One-to-One
- User → SchoolStudent (extended school student profile)
- Assessment → Certificate (one certificate per completed assessment)

### Many-to-Many
- User ↔ Permission (through user_permissions) - Enterprise RBAC
- Course ↔ Institution (through course_institutions) - Course offerings
- **Occupation ↔ Course (through occupation_courses) - Career pathways**

### Career Knowledge Graph
The platform connects students to career outcomes through this entity graph:

```
User (Test Taker)
  ├─→ EducationLevel (current education level)
  ├─→ Institution (school/university affiliation)
  ├─→ Occupation (current occupation if employed)
  └─→ Assessment (RIASEC test)
        ├─→ Holland Code (3-letter RIASEC profile)
        ├─→ EducationLevel (snapshot at test time)
        └─→ Recommendations:
              ├─→ Occupations (matched by Holland code)
              │     ├─→ EducationLevel (required education)
              │     └─→ Courses (via occupation_courses - career pathways)
              │           └─→ Institutions (via course_institutions - where to study)
              │                 └─→ CourseRequirements (entry requirements)
              └─→ Courses (matched by RIASEC codes)
                    ├─→ Institutions (where offered)
                    ├─→ CourseRequirements (entry requirements)
                    └─→ Occupations (via occupation_courses - career outcomes)
```

**Complete Student Journey:**
1. User takes Assessment → generates Holland Code
2. Holland Code matches → Occupations (career options)
3. Occupations link to → Courses (educational pathways via occupation_courses)
4. Courses link to → Institutions (where to study via course_institutions)
5. Courses have → CourseRequirements (what subjects/grades needed)
6. Courses lead back to → Occupations (career outcomes)

### Foreign Key Constraints
- All UUIDs use proper foreign key references
- Cascade deletes configured where appropriate (answers, course_requirements, occupation_courses)
- Nullable foreign keys for optional relationships

---

## Indexes

### Performance Indexes
```sql
-- User lookups
users(username) UNIQUE
users(email) UNIQUE
users(national_id) UNIQUE
users(student_number) UNIQUE
users(student_code) UNIQUE
users(institution_id)
users(role)
users(user_type)
users(education_level)
users(is_active)
users(is_email_verified)

-- Assessments
assessments(user_id)
assessments(status)
assessments(completed_at)
assessments(user_id, status)
assessments(holland_code)
assessments(created_at)

-- Answers
answers(assessment_id, question_id) UNIQUE
answers(question_id)
answers(assessment_id)
answers(section)
answers(riasec_type)
answers(assessment_id, section)

-- Subjects
subjects(is_active)
subjects(level)
subjects(display_order)

-- Certificates
certificates(assessment_id) UNIQUE
certificates(user_id)
certificates(generated_at)

-- Audit trails
audit_logs(user_id)
audit_logs(action_type)
audit_logs(created_at)
```

---

## RIASEC Scoring Algorithm

### Calculation Process

1. **Collect Responses**
   - Activities: Yes/No questions (1 point per "Yes")
   - Competencies: Rating scale (points = rating value)
   - Occupations: Interest selections (1 point per selection)
   - Self-Estimates: 1-7 scale ratings

2. **Aggregate by Category**
   ```
   Realistic Score = Sum(R questions) / Max possible × 100
   Investigative Score = Sum(I questions) / Max possible × 100
   ... (for each RIASEC category)
   ```

3. **Generate Holland Code**
   - Sort scores descending
   - Take top 3 letters
   - Example: S=85, A=72, E=68 → "SAE"

4. **Match Occupations**
   - Find occupations with matching Holland codes
   - Calculate compatibility score
   - Rank by match quality

---

## Data Protection & Security

### Compliance Features

1. **Data Minimization**
   - Only collect necessary information
   - Optional fields for sensitive data

2. **Purpose Limitation**
   - Clear data usage purposes
   - Separate test data from personal data

3. **Access Control**
   - Role-based permissions (admin, counselor, user)
   - Audit trail for all access

4. **Data Retention**
   - Configurable retention periods
   - Anonymization after completion
   - Right to erasure support

5. **Security Measures**
   - Password hashing (bcrypt)
   - HTTPS encryption required
   - IP address logging
   - Suspicious activity detection

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
```bash
# Create PostgreSQL database
createdb sds_test_db

# Update .env file
DB_NAME=sds_test_db
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Initialize Database
```bash
# Setup tables
node scripts/setup.js

# With sample data
node scripts/setup.js --seed
```

### 4. Verify Setup
```bash
# Start server
npm run dev

# Check logs for:
# Database connection established
# Database models synchronized
```

---

## Sample Queries

### Get User's Test History
```sql
SELECT 
  u.first_name, u.last_name,
  ta.attempt_number, ta.status,
  ta.completed_at,
  tr.holland_code, 
  tr.primary_interest
FROM users u
JOIN test_attempts ta ON u.id = ta.user_id
LEFT JOIN test_results tr ON ta.id = tr.attempt_id
WHERE u.email = 'user@example.com'
ORDER BY ta.created_at DESC;
```

### Career Recommendations for Holland Code
```sql
SELECT 
  o.name, o.name_swati,
  o.primary_riasec, o.secondary_riasec,
  o.local_demand, o.education_required
FROM occupations o
WHERE 'SAE' = ANY(o.holland_codes)
ORDER BY o.local_demand DESC;
```

### Analytics - RIASEC Distribution
```sql
SELECT 
  primary_interest,
  COUNT(*) as count,
  ROUND(AVG(realistic_score), 2) as avg_r_score,
  ROUND(AVG(investigative_score), 2) as avg_i_score,
  ROUND(AVG(artistic_score), 2) as avg_a_score,
  ROUND(AVG(social_score), 2) as avg_s_score,
  ROUND(AVG(enterprising_score), 2) as avg_e_score,
  ROUND(AVG(conventional_score), 2) as avg_c_score
FROM test_results
GROUP BY primary_interest
ORDER BY count DESC;
```

---

## Migration to Production

### Best Practices

1. **Use Migration Files**
   - Don't use `syncDatabase()` in production
   - Create Sequelize migrations
   - Version control migrations

2. **Backup Strategy**
   - Daily automated backups
   - Point-in-time recovery
   - Test restore procedures

3. **Performance Tuning**
   - Analyze slow queries
   - Add indexes as needed
   - Connection pooling

4. **Security Hardening**
   - Restrict database access
   - Use SSL connections
   - Regular security audits

---

## Support

For questions or issues:
- **Technical Lead:** Thokozani Ginindza
- **Lead Developer:** Nkhosini Gwebu
- **Project Admin:** Sibusiso Baartjies

---

---

## Database Migrations

All schema changes are managed through Sequelize migrations in `/backend/migrations/`:

1. `20260126170000-enable-uuid-extension.js` - Enable UUID extension
2. `20260126180000-create-education-levels.js` - Education levels table
3. `20260126180100-create-institutions.js` - Institutions table
4. `20260126180200-create-users.js` - Users table with RBAC
5. `20260126180300-create-assessments.js` - Assessments table
6. `20260126180400-create-answers.js` - Answers table
7. `20260126180500-create-questions.js` - Questions table
8. `20260126180600-create-occupations.js` - Occupations table
9. `20260126180700-create-audit-logs.js` - Audit logs table
10. `20260310100100-create-courses.js` - Courses table
11. `20260310100200-create-course-requirements.js` - Course requirements table
12. `20260310100300-create-course-institutions.js` - Course-institution junction
13. `20260310100400-create-school-students.js` - School students table
14. `20260312000002-create-subjects.js` - Subjects table
15. `20260312170000-create-permissions-system.js` - Permissions & user_permissions
16. `20260312190000-create-user-qualifications.js` - User qualifications table
17. `20260313000001-create-certificates.js` - Certificates table
18. `20260313100000-add-entity-linking.js` - Add current_occupation_id FK to users, status/submitted_by to occupations & institutions, relax occupation code constraint
19. `20260313110000-create-occupation-courses.js` - Occupation-course junction (career pathways)

**Migration Commands:**
```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

---

**Version:** 2.0  
**Last Updated:** March 2026  
**Ministry of Labour and Social Security - Kingdom of Eswatini**
