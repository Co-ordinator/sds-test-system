# Complete Setup Guide - SDS Test System

## Overview

Implementation of the Ministry of Labour's Self-Directed Search (SDS) Test System with:

**228 Questions** from the actual Ministry of Labour Career Interest Books  
**4 Test Sections**: Activities, Competencies, Occupations, Self-Estimates  
**Full RIASEC Model** implementation  
**35+ Occupations** with Holland codes  
**5 Eswatini Institutions** (UNESWA, ECOT, GVTI, SANU, LUCT)  
**Complete Database Models** with audit logging  
**Multi-language Support** (English & siSwati placeholders)

---

## Quick Start (5 Minutes)

### 1. Create PostgreSQL Database

```bash
# Open PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sds_test_db;

# Create user (optional)
CREATE USER sds_admin WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sds_test_db TO sds_admin;

# Exit
\q
```

### 2. Configure Environment

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sds_test_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Install & Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Setup database and seed data
npm run setup
```

### 4. Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**You're ready! 🎉**

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- API Health: http://localhost:5000/health

---

## Test Accounts

### Admin Account
- **Email**: `admin@labor.gov.sz`
- **Password**: `Admin@123`
- **Role**: Full system access

### Counselor Account
- **Email**: `counselor@labor.gov.sz`
- **Password**: `Counselor@123`
- **Role**: Manage students, review results

### Student Account
- **Email**: `student@test.sz`
- **Password**: `Student@123`
- **Role**: Take tests, view results

⚠️ **IMPORTANT**: These accounts must be removed in production!

---

## SDS Test Structure

### Section 1: Activities (66 Questions)
**Type**: Yes/No  
**Time**: ~10 minutes  
**Questions**: "Fix electrical apparatus", "Read scientific books", "Sketch, draw or paint"...

**Scoring**: Each YES = 1 point toward corresponding RIASEC category

### Section 2: Competencies (66 Questions)
**Type**: Yes/No  
**Time**: ~10 minutes  
**Questions**: "I can use a voltmeter", "I can use algebra", "I can play a musical instrument"...

**Scoring**: Each YES = 1 point toward corresponding RIASEC category

### Section 3: Occupations (84 Questions)
**Type**: Yes/No  
**Time**: ~15 minutes  
**Questions**: Interest in careers like "Motor mechanic", "Medical doctor", "Journalist"...

**Scoring**: Each YES = 1 point toward corresponding RIASEC category

### Section 4: Self-Estimates (12 Questions)
**Type**: Rating Scale (1-6)  
**Time**: ~5 minutes  
**Questions**: Rate abilities like "Mechanical ability", "Scientific ability", "Artistic ability"...

**Scoring**: Rating value × multiplier toward corresponding RIASEC category

**Total Test Time**: ~45 minutes  
**Total Questions**: 228

---

## RIASEC Scoring Algorithm

### 1. Calculate Raw Scores

```javascript
// For each RIASEC category (R, I, A, S, E, C):

// Activities (11 questions × 1 point) = Max 11
activitiesScore = count(YES responses for category)

// Competencies (11 questions × 1 point) = Max 11  
competenciesScore = count(YES responses for category)

// Occupations (14 questions × 1 point) = Max 14
occupationsScore = count(YES responses for category)

// Self-Estimates (2 questions × rating value) = Max 12
selfEstimatesScore = sum(ratings for category)

// Total Raw Score per category = Max 48
categoryRawScore = activitiesScore + competenciesScore + 
                  occupationsScore + selfEstimatesScore
```

### 2. Convert to Percentage

```javascript
// Convert to 0-100 scale
categoryPercentage = (categoryRawScore / 48) × 100
```

### 3. Generate Holland Code

```javascript
// Sort categories by score (descending)
scores = [
  { code: 'R', score: 75 },
  { code: 'I', score: 68 },
  { code: 'A', score: 82 },
  { code: 'S', score: 55 },
  { code: 'E', score: 48 },
  { code: 'C', score: 60 }
].sort((a, b) => b.score - a.score)

// Take top 3
hollandCode = scores[0].code + scores[1].code + scores[2].code
// Example: "AIR" (Artistic-Investigative-Realistic)
```

### 4. Match Occupations

```javascript
// Find occupations with matching Holland codes
matchingOccupations = occupations.filter(occ => 
  occ.hollandCodes.includes(hollandCode) ||
  occ.hollandCodes.includes(hollandCode.substring(0,2))
)

// Calculate match score
matchScore = calculateCompatibility(userScores, occupationProfile)

// Rank by best match
recommendations = matchingOccupations
  .sort((a, b) => b.matchScore - a.matchScore)
  .slice(0, 10) // Top 10 recommendations
```

---

## Database Schema Overview

### Core Tables

**users** (14 fields)
- Authentication & profile
- Role-based access (admin/counselor/user)
- Accessibility preferences

**tests** (9 fields)
- Test definitions
- Multi-language support

**test_sections** (11 fields)
- Activities, Competencies, Occupations, Self-Estimates

**questions** (14 fields)
- 228 questions with RIASEC categories
- Yes/No and Rating scale types

**test_attempts** (18 fields)
- User test sessions
- Progress tracking
- Resume capability

**test_responses** (11 fields)
- Individual answers
- Time tracking
- Modification history

**test_results** (23 fields)
- RIASEC scores (0-100 each)
- Holland Code (3-letter)
- Interpretation

**occupations** (18 fields)
- 35+ career options
- Holland codes mapping
- Eswatini-specific data

**institutions** (28 fields)
- 5 Eswatini institutions
- Programs & bursaries

**audit_logs** (32 fields)
- Complete activity tracking
- Security monitoring

---

## API Endpoints (To Build Next)

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

### Tests
```
GET    /api/v1/tests
GET    /api/v1/tests/:id
GET    /api/v1/tests/:id/sections
GET    /api/v1/tests/:id/sections/:sectionId/questions
```

### Test Taking
```
POST   /api/v1/attempts          # Start new attempt
GET    /api/v1/attempts/:id      # Get attempt details
PATCH  /api/v1/attempts/:id      # Update progress
POST   /api/v1/attempts/:id/responses  # Submit answers
POST   /api/v1/attempts/:id/complete   # Finish test
```

### Results
```
GET    /api/v1/results/:attemptId
GET    /api/v1/results/:attemptId/report
GET    /api/v1/results/:attemptId/recommendations
```

### Admin
```
GET    /api/v1/admin/users
GET    /api/v1/admin/analytics
GET    /api/v1/admin/audit-logs
```

---

## Next Development Steps

### Phase 1: Core Functionality (Week 1-2)
1. ✅ Database models - DONE
2. ✅ Authentication API (register, login, JWT)
3. 🔨 Test API (get tests, sections, questions)
4. 🔨 Test-taking API (start, save, complete)
5. 🔨 Scoring algorithm implementation

### Phase 2: User Interface (Week 3-4)
1. 🔨 Login/Register pages
2. 🔨 Dashboard
3. 🔨 Test interface (question by question)
4. 🔨 Results page with RIASEC visualization
5. 🔨 Career recommendations page

### Phase 3: Admin & Analytics (Week 5-6)
1. 🔨 Admin dashboard
2. 🔨 User management
3. 🔨 Analytics reports
4. 🔨 Audit logs viewer

### Phase 4: Advanced Features (Week 7-8)
1. 🔨 Counselor portal
2. 🔨 Group management
3. 🔨 PDF report generation
4. 🔨 siSwati translations

### Phase 5: Testing & Deployment (Week 9-12)
1. 🔨 Unit tests
2. 🔨 Integration tests
3. 🔨 User acceptance testing
4. 🔨 Production deployment

---

## File Structure

```
sds-test-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js ✅
│   │   │   └── setupDatabase.js ✅
│   │   ├── models/
│   │   │   ├── index.js ✅
│   │   │   ├── User.js ✅
│   │   │   ├── Test.js ✅
│   │   │   ├── TestSection.js ✅
│   │   │   ├── Question.js ✅
│   │   │   ├── TestAttempt.js ✅
│   │   │   ├── TestResponse.js ✅
│   │   │   ├── TestResult.js ✅
│   │   │   ├── Occupation.js ✅
│   │   │   ├── OccupationRecommendation.js ✅
│   │   │   ├── Career.js ✅
│   │   │   ├── Institution.js ✅
│   │   │   └── AuditLog.js ✅
│   │   ├── seeders/
│   │   │   ├── index.js ✅
│   │   │   ├── completeSdsData.js ✅
│   │   │   └── occupationsData.js ✅
│   │   ├── controllers/ 🔨
│   │   ├── routes/ 🔨
│   │   ├── middleware/ 🔨
│   │   ├── utils/ 🔨
│   │   └── server.js ✅
│   ├── scripts/
│   │   └── setup.js ✅
│   ├── .env
│   ├── .gitignore ✅
│   └── package.json ✅
│
├── frontend/
│   ├── src/
│   │   ├── components/ 🔨
│   │   ├── pages/ 🔨
│   │   ├── services/
│   │   │   └── api.js ✅
│   │   ├── App.js ✅
│   │   └── index.js ✅
│   ├── .env
│   ├── tailwind.config.js ✅
│   └── package.json ✅
│
└── README.md ✅
```

**Legend:**
- ✅ Complete
- 🔨 To Build Next

---

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check credentials in .env match database
psql -U postgres -d sds_test_db
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Seeding Fails
```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE sds_test_db;
CREATE DATABASE sds_test_db;
\q

# Run setup again
cd backend
npm run setup
```

---

## Resources & References

**Official SDS Resources:**
- [Ministry of Labour Career Interest Books (2019)](source-document.pdf)
- Holland's Self-Directed Search (J.L. Holland)
- South African HSRC version (1997)

**Technical Documentation:**
- [React Documentation](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

**Eswatini Institutions:**
- [UNESWA](https://www.uneswa.ac.sz)
- [ECOT](https://www.ecot.ac.sz)
- [SANU](https://www.sanu.ac.sz)

---

## Support & Contact

**Project Team:**
- **Technical Lead**: Thokozani Ginindza
- **Lead Developer**: Nkhosini Gwebu
- **Project Administrator**: Sibusiso Baartjies

**Ministry of Labour and Social Security**  
Measurement and Testing Unit  
P.O. Box 198, Mbabane H100  
Kingdom of Eswatini  
Tel: +268 4041971/2/3

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Development Ready 🚀