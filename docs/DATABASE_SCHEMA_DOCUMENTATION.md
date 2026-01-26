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
- `nationalId` - Eswatini National ID
- `role` - `admin` | `counselor` | `user`
- `region` - `hhohho` | `manzini` | `lubombo` | `shiselweni`
- `educationLevel` - Current education level
- `employmentStatus` - Current employment status
- `preferredLanguage` - `en` | `ss` (English/siSwati)
- `accessibilityNeeds` - JSONB for WCAG compliance

**Security Features:**
- Password hashing via bcrypt (10 rounds)
- Password reset tokens
- Email verification
- Last login tracking

---

### 2. Test Structure

#### **tests**
Master test definitions (currently SDS 1.0)

**Key Fields:**
- `id` (UUID)
- `name`, `nameSwati` - Test names
- `version` - Version number
- `estimatedDuration` - Expected completion time (minutes)
- `isActive` - Enable/disable tests

#### **test_sections**
Sections within each test (Activities, Competencies, Occupations, Self-Estimates)

**Key Fields:**
- `testId` - Foreign key to tests
- `sectionType` - `activities` | `competencies` | `occupations` | `self_estimates`
- `orderIndex` - Display order
- `isRequired` - Mandatory sections

#### **questions**
Individual assessment questions

**Key Fields:**
- `sectionId` - Foreign key to test_sections
- `questionText`, `questionTextSwati` - Question content
- `riasecCategory` - `R` | `I` | `A` | `S` | `E` | `C`
- `questionType` - `yes_no` | `rating_scale` | `multiple_choice`
- `scaleMin`, `scaleMax` - For rating questions
- `orderIndex` - Display order

**RIASEC Categories:**
- **R** - Realistic (hands-on, practical)
- **I** - Investigative (analytical, scientific)
- **A** - Artistic (creative, expressive)
- **S** - Social (helping, teaching)
- **E** - Enterprising (leading, persuading)
- **C** - Conventional (organizing, detail-oriented)

---

### 3. Test Taking & Responses

#### **test_attempts**
Tracks each user's test-taking session

**Key Fields:**
- `userId` - Test taker
- `testId` - Which test
- `attemptNumber` - Retry count
- `status` - `not_started` | `in_progress` | `completed` | `abandoned`
- `startedAt`, `completedAt` - Timestamps
- `timeSpent` - Total time in seconds
- `progressPercentage` - Completion tracking
- `currentSectionId` - Resume capability
- `supervisedBy` - Counselor oversight (optional)

**Features:**
- Progress tracking for resume capability
- Device info for analytics
- Session data for state management
- Counselor supervision support

#### **test_responses**
Individual question responses

**Key Fields:**
- `attemptId` - Which test attempt
- `questionId` - Which question
- `responseValue` - User's answer
- `responseScore` - Calculated score
- `timeSpent` - Time on this question
- `isModified` - Changed answer tracking
- `modificationCount` - Number of changes

**Analytics:**
- First response timestamp
- Modification tracking
- Time analysis per question

---

### 4. Results & Scoring

#### **test_results**
RIASEC scores and Holland Code calculation

**Key Fields:**
- `attemptId` - One-to-one with test_attempts
- `realisticScore`, `investigativeScore`, `artisticScore`, `socialScore`, `enterprisingScore`, `conventionalScore` - 0-100 scale
- `hollandCode` - 3-letter code (e.g., 'SAE', 'RIA')
- `primaryInterest`, `secondaryInterest`, `tertiaryInterest` - Top 3 categories
- `sectionScores` - JSONB breakdown by section
- `consistencyScore` - Response reliability
- `profileDifferentiation` - Interest clarity
- `interpretation` - Generated guidance text
- `reportUrl` - PDF report location

**Counselor Review:**
- `reviewedBy` - Counselor ID
- `reviewedAt` - Review timestamp
- `counselorNotes` - Professional notes

**Methods:**
- `calculateHollandCode()` - Auto-generate code from scores
- `getScoreByCategory(category)` - Retrieve individual scores

---

### 5. Career Resources

#### **occupations**
Career options mapped to RIASEC codes

**Key Fields:**
- `name`, `nameSwati` - Occupation names
- `hollandCodes` - Array of matching codes
- `primaryRiasec`, `secondaryRiasec` - Main categories
- `educationRequired` - Entry requirements
- `demandLevel` - Labor market demand
- `availableInEswatini` - Local availability
- `localDemand` - Eswatini-specific demand
- `skills` - Required competencies
- `averageSalary` - Compensation info

#### **occupation_recommendations**
Links test results to suggested careers

**Key Fields:**
- `resultId` - Test result
- `occupationId` - Recommended occupation
- `matchScore` - 0-100 compatibility
- `rank` - Recommendation order
- `matchExplanation` - Why this matches

#### **careers**
Detailed career pathway information

**Key Fields:**
- `name`, `field`, `subfield` - Career classification
- `educationPathways` - JSONB with training routes
- `employmentOutlook` - Market trends
- `localDemand` - Eswatini needs
- `governmentPriority` - National development alignment
- `requiredSkills`, `softSkills` - Competencies
- `careerProgression` - Advancement path

#### **institutions**
Educational institutions in Eswatini

**Key Fields:**
- `name`, `acronym` - Institution identity
- `type` - `university` | `college` | `tvet` | `vocational`
- `region` - Geographic location
- `programs` - JSONB course offerings
- `bursariesAvailable` - Financial aid
- `bursaryInfo` - JSONB scholarship details
- `admissionRequirements` - Entry criteria
- `facilities`, `studentServices` - Campus resources

**Major Institutions:**
- UNESWA (University of Eswatini)
- ECOT (Eswatini College of Technology)
- GVTI (Gwamile Vocational and Commercial Training Institute)
- SANU (Southern African Nazarene University)
- Limkokwing University

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

---

## Relationships

### One-to-Many
- User → TestAttempts (user can take multiple tests)
- Test → TestSections (test has multiple sections)
- TestSection → Questions (section has multiple questions)
- TestAttempt → TestResponses (attempt has multiple responses)
- TestResult → OccupationRecommendations (result has multiple recommendations)

### One-to-One
- TestAttempt ↔ TestResult (each attempt has one result)

### Many-to-Many
- Occupation ↔ Career (through occupation_careers)
- Occupation ↔ Institution (through occupation_institutions)
- Career ↔ Institution (through career_institutions)

---

## Indexes

### Performance Indexes
```sql
-- User lookups
users(email), users(national_id), users(role)

-- Test progress
test_attempts(user_id, test_id), test_attempts(status)

-- Responses
test_responses(attempt_id, question_id)

-- Results analysis
test_results(holland_code), test_results(primary_interest)

-- Career matching
occupations(primary_riasec), occupations(holland_codes) USING GIN

-- Audit trails
audit_logs(user_id), audit_logs(action), audit_logs(created_at)
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
