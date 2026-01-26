# SDS Test System - Database Schema Documentation

## Overview

The Online Self-Directed Search (SDS) Test System database is designed to support Holland's RIASEC career assessment model for the Ministry of Labour and Social Security of Eswatini.

### Key Features
- **RIASEC Model Implementation** - Full support for Realistic, Investigative, Artistic, Social, Enterprising, and Conventional assessment
- **Multi-language Support** - English and siSwati
- **Comprehensive Audit Trail** - Complete logging for compliance
- **Data Protection Compliant** - Aligned with Eswatini Data Protection Act 2022
- **Scalable Architecture** - Supports 500+ concurrent users
- **Career Resources Integration** - Links to local institutions and opportunities

---

## Database Tables

### 1. User Management

#### **users**
Stores all system users (students, counselors, administrators)

**Key Fields:**
- `id` (UUID) - Primary key
- `email` - Unique email address
- `password` - Bcrypt hashed password
- `firstName`, `lastName` - User names
- `nationalId` - Eswatini National ID (13 digits, numeric, nullable)
- `role` - `admin` | `counselor` | `user`
- `region` - `hhohho` | `manzini` | `lubombo` | `shiselweni`
- `district`, `address`
- `educationLevel` - FK → education_levels.level
- `employmentStatus` - Current employment status
- `currentOccupation`
- `institutionId` - FK → institutions.id
- `preferredLanguage` - `en` | `ss` (English/siSwati)
- `accessibilityNeeds` - JSONB for WCAG compliance
- `isConsentGiven`, `consentDate`
- `isActive`
- `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpires`
- `phoneNumber`
- `dateOfBirth`, `gender`
- `currentInstitution`, `gradeLevel`
- `requiresAccessibility`
- `lastLogin`
- `passwordResetToken`, `passwordResetExpires`
- `refreshToken`, `refreshTokenExpires`
- `counselorCode` (unique, nullable)
- `organization`

**Security Features:**
- Password hashing via bcrypt (10 rounds)
- Password reset tokens
- Email verification
- Last login tracking

---

### 2. Test Structure

#### **questions**
Individual assessment questions (static bank)

**Key Fields:**
- `id` (PK, integer, auto-increment)
- `text` - Question text
- `section` - `activities` | `competencies` | `occupations` | `self_estimates`
- `riasecType` - `R` | `I` | `A` | `S` | `E` | `C`
- `order` - Required display order

**Validation Notes:**
- `order` is required (no nulls)

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
Career options mapped to RIASEC codes

**Key Fields:**
- `code` - 3-letter Holland code
- `name` - Occupation name
- `hollandCodes` - Array of matching codes
- `primaryRiasec`, `secondaryRiasec`
- `description`, `category`
- `educationLevel` - FK → education_levels.level
- `educationRequired` - Text
- `demandLevel`, `localDemand`
- `availableInEswatini` (boolean)
- `skills` - Array of strings

#### **institutions**
Educational institutions in Eswatini

**Key Fields:**
- `id` (UUID)
- `name`, `nameSwati` (optional), `acronym`
- `type` - `university` | `college` | `tvet` | `school` | `vocational` | `other`
- `region`, `district`
- `description`, `descriptionSwati`
- `phoneNumber`, `email`, `website`
- `accredited` (boolean)
- `programs` - JSONB offerings
- `bursariesAvailable` (boolean)
- `facilities` - string[]

#### **education_levels**
Lookup table for education level codes

**Key Fields:**
- `level` (integer) - Primary key
- `description` (string, required)

---

### 6. Audit & Compliance

#### **audit_logs**
Comprehensive activity logging for compliance

**Fields:**
- `id` - UUID primary key
- `userId` - UUID (nullable foreign key)
- `actionType` - ENUM(LOGIN, REGISTER, TEST_COMPLETE, etc)
- `description` - String (human-readable summary)
- `details` - JSONB (technical details/state changes)
- `ipAddress` - String (client IP)
- `userAgent` - String (client browser/device)
- `createdAt` - Timestamp

**Action Types:**
- Authentication: LOGIN, LOGOUT, REGISTER, PASSWORD_RESET
- Testing: TEST_START, TEST_COMPLETE
- Profile: PROFILE_UPDATE
- Security: ACCESS_DENIED, SUSPICIOUS_ACTIVITY
- Admin: USER_DELETION, SYSTEM_UPDATE

**Logging Pattern:**
```javascript
logger.info({
  actionType: 'LOGIN',
  message: 'User logged in',
  req: requestObject,
  details: { userId: 'abc123' }
});
```

**Validation Notes:**
- `actionType` must match defined enum values in the model

---

## Relationships

### One-to-Many
- User → Assessments (user can take multiple assessments)
- Assessment → Answers (assessment has many answers)
- Institution → Users (optional affiliation)
- EducationLevel → Users (via educationLevel)
- EducationLevel → Occupations (via educationLevel)

### One-to-One
- (none currently — results are embedded on assessments)

### Many-to-Many
- (none documented in current models)

---

## Indexes

### Performance Indexes
```sql
-- User lookups
users(email), users(national_id), users(role), users(institution_id), users(education_level), users(is_active), users(is_email_verified)

-- Assessments
assessments(user_id), assessments(status), assessments(completed_at), assessments(user_id, status), assessments(holland_code), assessments(created_at)

-- Answers
answers(assessment_id, question_id) UNIQUE, answers(question_id), answers(assessment_id), answers(section), answers(riasec_type), answers(assessment_id, section)

-- Career matching
occupations(primary_riasec), occupations(holland_codes) USING GIN

-- Audit trails
audit_logs(user_id), audit_logs(action_type), audit_logs(created_at)
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

**Version:** 1.0  
**Last Updated:** January 2026  
**Ministry of Labour and Social Security - Kingdom of Eswatini**
