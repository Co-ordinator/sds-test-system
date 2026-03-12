# Complete Setup Guide - SDS Test System

## Overview

Implementation of the Ministry of Labour's Self-Directed Search (SDS) Test System with:

**228 Questions** from the actual Ministry of Labour Career Interest Books  
**4 Test Sections**: Activities, Competencies, Occupations, Self-Estimates  
**Full RIASEC Model** implementation with career-to-course-to-institution chain  
**35+ Occupations** with Holland codes and local demand data  
**25+ Courses** (bachelor, diploma, TVET, certificate programs)  
**20+ Eswatini Institutions** (universities, colleges, TVET, schools)  
**25+ Subjects** with RIASEC mapping  
**Enterprise RBAC** - 49 permissions across 13 modules  
**Complete Database Models** with comprehensive audit logging  
**Multi-language Support** (English & siSwati)  
**Advanced Analytics** - Regional, segmentation, skills pipeline, interactive maps  
**PDF Generation** - Results reports, certificates, login cards  
**Student Management** - CSV import, bulk user creation, login card printing

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
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_minimum_32_chars
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Email (for production - optional in development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@sds.gov.sz

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API Base URL
API_BASE_URL=http://localhost:5000/api/v1
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### 3. Install & Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npx sequelize-cli db:migrate

# Seed database with test data
npx sequelize-cli db:seed:all
```

**Note:** Migrations create all tables and the seeder populates:
- 5 education levels
- 20+ institutions (universities, colleges, TVET, schools)
- 228 SDS questions
- 35+ occupations with Holland codes
- 25+ courses with entry requirements
- 25+ subjects with RIASEC mapping
- 49 permissions across 13 modules
- 5 test user accounts (see below)

### 4. Install & Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### 5. Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**You're ready! 🎉**

- **Backend API**: http://localhost:5000/api/v1
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:5000/health

---

## Test Accounts

### System Administrator
- **Username**: `sysadmin`
- **Email**: `admin@labor.gov.sz`
- **Password**: `Admin@123`
- **Role**: `System Administrator`
- **User Type**: `System Administrator`
- **Permissions**: All 49 permissions
- **Access**: Full system access including user management, permissions, analytics, audit logs
- **Institution**: Ministry of Labour and Social Security

### Test Administrator (Counselor)
- **Username**: `testadmin.mbabane`
- **Email**: `testadmin@labor.gov.sz`
- **Password**: `TestAdmin@123`
- **Role**: `Test Administrator`
- **User Type**: `Test Administrator`
- **Permissions**: 16 default permissions (test_takers.manage, assessments.view, results.view, etc.)
- **Access**: Import students, generate login cards, view student results, institution analytics
- **Institution**: Mbabane Government High School

### Test Taker (High School Student)
- **Username**: `20250101`
- **Email**: None (counselor-created account)
- **Password**: `Pass@2025`
- **Role**: `Test Taker`
- **User Type**: `High School Student`
- **Student Number**: `20250101`
- **Grade**: Form 5
- **Class**: 5A
- **Access**: Take assessments, view own results, download certificate
- **Institution**: Mbabane Government High School

### Test Taker (University Student)
- **Username**: `zanele.motsa`
- **Email**: `zanele.motsa@student.uneswa.sz`
- **Password**: `Student@123`
- **Role**: `Test Taker`
- **User Type**: `University Student`
- **Degree Program**: Bachelor of Science
- **Year of Study**: 2
- **Access**: Take assessments, view own results with course recommendations
- **Institution**: University of Eswatini (UNESWA)

### Test Taker (Professional)
- **Username**: `mandla.dlamini`
- **Email**: `mandla.dlamini@gmail.com`
- **Password**: `Professional@123`
- **Role**: `Test Taker`
- **User Type**: `Professional`
- **Current Occupation**: Software Developer
- **Years Experience**: 5
- **Access**: Take assessments, view career transition recommendations

⚠️ **IMPORTANT**: These accounts are for development/testing only and must be removed before production deployment!

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

### Core Tables (16 tables total)

**users** (40+ fields)
- Authentication & profile (username, email, password, nationalId)
- Role-based access (System Administrator/Test Administrator/Test Taker)
- User types (High School Student/University Student/Professional/Test Administrator/System Administrator)
- Extended journey fields (studentNumber, className, degreeProgram, yearOfStudy, yearsExperience)
- Password change enforcement (mustChangePassword)
- Accessibility preferences (WCAG compliance)
- Security tokens (email verification, password reset, refresh tokens)

**permissions** (49 permissions across 13 modules)
- users, institutions, questions, occupations, subjects, assessments, results, analytics, audit, notifications, certificates, permissions, test_takers
- Granular permission codes (e.g., users.view, users.create, analytics.export)

**user_permissions**
- Many-to-many junction table
- Links users to specific permissions

**education_levels** (5 levels)
- Levels 1-5 from SDS Appendix
- Referenced by users and occupations

**institutions** (20+ institutions)
- Universities, colleges, TVET, schools
- Multi-language support (name, nameSwati)
- Programs, facilities, bursaries
- Regional distribution across Eswatini

**questions** (228 questions)
- 4 sections: activities, competencies, occupations, self_estimates
- RIASEC type mapping (R, I, A, S, E, C)
- Question codes for reference

**assessments**
- User test sessions
- Progress tracking (0-100%)
- RIASEC scores (scoreR, scoreI, scoreA, scoreS, scoreE, scoreC)
- Holland Code (3-letter)
- Status (in_progress, completed, expired)

**answers**
- Individual question responses
- Values: YES/NO or 1-6 (self-estimates)
- Linked to assessments and questions
- Cascade delete with assessments

**occupations** (35+ careers)
- Holland codes mapping
- Local demand levels (low, medium, high, critical)
- Education requirements
- Eswatini availability
- Skills arrays

**courses** (25+ programs)
- Qualification types (certificate, diploma, bachelor, honours, masters, doctorate, TVET)
- Duration, description, field of study
- RIASEC codes for matching
- Suggested subjects

**course_requirements**
- Entry requirements per course
- Subject + minimum grade
- Mandatory vs optional

**course_institutions**
- Many-to-many linking courses to institutions
- Custom requirements per institution
- Application URLs

**subjects** (25+ subjects)
- High school and tertiary subjects
- RIASEC code mapping
- Display order for UI

**school_students**
- Extended profile for school students
- Grade, class, student number
- Login card printing tracking
- Links to users and institutions

**certificates**
- Generated certificates for completed assessments
- Certificate numbers
- Generation tracking

**audit_logs**
- Complete activity tracking
- Security monitoring
- Action types (LOGIN, REGISTER, ACCESS_DENIED, etc.)
- IP address and user agent logging

---

## Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v5
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize v6
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Logging**: Winston with daily rotate
- **Email**: Nodemailer with Handlebars templates
- **PDF Generation**: PDFKit
- **CSV Parsing**: csv-parse
- **Security**: Helmet, express-rate-limit, CORS

### Frontend
- **Framework**: React 19
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v3
- **Forms**: React Hook Form with Joi validation
- **HTTP Client**: Axios
- **Charts**: Recharts v3
- **Maps**: React Leaflet v5 + Leaflet v1.9
- **Icons**: Lucide React
- **Build Tool**: React Scripts (Create React App)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint (implicit via React Scripts)
- **Testing**: Jest (configured, tests pending)

## Key Features Implemented

### Authentication & Authorization
- ✅ User registration with email verification
- ✅ Login with email/username/studentNumber
- ✅ JWT access tokens + refresh tokens
- ✅ Password reset via email
- ✅ Change password (authenticated users)
- ✅ Role-based access control (3 roles)
- ✅ Enterprise RBAC with 49 granular permissions
- ✅ National ID parsing (auto-extract DOB & gender)

### Assessment System
- ✅ 228 SDS questions across 4 sections
- ✅ Progress saving and resume capability
- ✅ RIASEC scoring algorithm
- ✅ Holland Code generation (3-letter)
- ✅ Career recommendations based on Holland Code
- ✅ Course recommendations with entry requirements
- ✅ Institution matching
- ✅ Subject suggestions
- ✅ PDF results report generation
- ✅ Certificate generation and download

### Admin Dashboard
- ✅ User management (create, update, delete, permissions)
- ✅ Question bank management (CRUD, import/export CSV)
- ✅ Occupation management (CRUD, import/export CSV)
- ✅ Subject management (CRUD, import/export CSV)
- ✅ Institution management
- ✅ System analytics with filters
- ✅ Regional analytics
- ✅ Segmentation analytics (gender, user type, education level)
- ✅ Skills pipeline analytics
- ✅ Audit log viewer
- ✅ Notification system
- ✅ Data export (users, assessments, analytics)

### Test Administrator/Counselor Features
- ✅ Student import via CSV
- ✅ Bulk user creation with auto-generated passwords
- ✅ Login card generation (PDF with credentials)
- ✅ Student management (view, update, delete)
- ✅ Student results viewing
- ✅ Institution statistics
- ✅ Student filtering by grade/class

### Analytics & Reporting
- ✅ Interactive Eswatini map with regional data
- ✅ RIASEC distribution charts
- ✅ Holland Code trends
- ✅ Career field popularity
- ✅ Assessment completion rates
- ✅ Gender and user type segmentation
- ✅ Skills pipeline momentum tracking
- ✅ Emerging careers identification
- ✅ Education pathway demand analysis

### Data Protection & Compliance
- ✅ GDPR-compliant data export (Right to Access)
- ✅ Account deletion (Right to Erasure)
- ✅ Consent tracking
- ✅ Comprehensive audit logging
- ✅ IP address and user agent tracking
- ✅ Accessibility support (WCAG compliance fields)

### UI/UX Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Multi-step registration flow
- ✅ User type-specific onboarding
- ✅ Progress indicators
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Role-based navigation
- ✅ Data tables with sorting and pagination
- ✅ Interactive charts and visualizations
- ✅ PDF preview and download

---

## Development Status

### ✅ Completed Features

**Phase 1: Core Functionality**
- ✅ Database models and migrations (16 tables)
- ✅ Authentication API (register, login, JWT, password reset)
- ✅ Assessment API (start, save progress, complete)
- ✅ Scoring algorithm (RIASEC + Holland Code)
- ✅ Recommendations engine (careers → courses → institutions)

**Phase 2: User Interface**
- ✅ Login/Register pages with multi-step flow
- ✅ Role-specific dashboards (Admin, Counselor, Test Taker)
- ✅ Assessment interface (228 questions, 4 sections)
- ✅ Results page with RIASEC visualization
- ✅ Career and course recommendations display
- ✅ Certificate viewing and download

**Phase 3: Admin & Analytics**
- ✅ Admin dashboard (6 panels)
- ✅ User management with permissions
- ✅ Question/Occupation/Subject management
- ✅ Advanced analytics (regional, segmentation, pipeline)
- ✅ Interactive map visualization
- ✅ Audit logs viewer

**Phase 4: Advanced Features**
- ✅ Counselor portal (5 tabs)
- ✅ Student import and management
- ✅ Login card generation
- ✅ PDF report generation (results, certificates, login cards)
- ✅ Enterprise RBAC system
- ✅ Notification system

### 🔨 Pending Features

**Phase 5: Localization**
- 🔨 siSwati translations (UI strings)
- 🔨 siSwati question translations
- 🔨 Language switcher component
- 🔨 RTL support (if needed)

**Phase 6: Testing**
- 🔨 Backend unit tests (Jest)
- 🔨 Frontend component tests (React Testing Library)
- 🔨 Integration tests (Supertest)
- 🔨 E2E tests (optional: Playwright/Cypress)
- 🔨 Load testing
- 🔨 User acceptance testing

**Phase 7: Production Readiness**
- 🔨 Environment-specific configurations
- 🔨 Production database setup
- 🔨 Email service configuration (SMTP)
- 🔨 SSL certificate setup
- 🔨 Domain configuration
- 🔨 Server deployment (PM2, Docker, or cloud platform)
- 🔨 Database backups and restore procedures
- 🔨 Monitoring and alerting (optional: Sentry, LogRocket)
- 🔨 Remove test accounts
- 🔨 Security audit

### 📋 Optional Enhancements
- 🔨 Mobile app (React Native)
- 🔨 Offline assessment capability
- 🔨 SMS notifications
- 🔨 Bulk email campaigns
- 🔨 Advanced reporting (custom date ranges, filters)
- 🔨 Career pathway visualization
- 🔨 Institution comparison tool
- 🔨 Student progress tracking over time
- 🔨 Counselor appointment scheduling

---

## File Structure

```
sds-test-system/
├── backend/
│   ├── config/
│   │   ├── database.config.js ✅
│   │   ├── email.config.js ✅
│   │   └── .sequelizerc ✅
│   ├── migrations/ (16 migrations) ✅
│   ├── seeders/ (8 seeders) ✅
│   ├── scripts/
│   │   ├── create-db.js ✅
│   │   ├── ensure-user-schema.js ✅
│   │   └── backfill-student-codes.js ✅
│   ├── src/
│   │   ├── constants/
│   │   │   └── roles.js ✅
│   │   ├── controllers/ (9 controllers) ✅
│   │   ├── middleware/ (5 middleware) ✅
│   │   ├── models/ (17 models) ✅
│   │   ├── routes/ (6 route files) ✅
│   │   ├── services/
│   │   │   ├── scoring.service.js ✅
│   │   │   └── studentImport.service.js ✅
│   │   ├── utils/
│   │   │   └── logger.js ✅
│   │   └── validations/ (4 validation schemas) ✅
│   ├── .env (create from template)
│   ├── .gitignore ✅
│   ├── package.json ✅
│   └── server.js ✅
│
├── frontend/
│   ├── public/
│   │   ├── index.html ✅
│   │   └── siyinqaba.png ✅
│   ├── src/
│   │   ├── components/
│   │   │   ├── data/
│   │   │   │   └── DataTable.jsx ✅
│   │   │   └── ui/
│   │   │       └── StatusIndicators.jsx ✅
│   │   ├── context/
│   │   │   └── AuthContext.js ✅
│   │   ├── data/
│   │   │   └── eswatiniGeoJson.js ✅
│   │   ├── features/
│   │   │   ├── admin/ (6 panels) ✅
│   │   │   ├── analytics/ (5 sections) ✅
│   │   │   └── counselor/ (5 panels) ✅
│   │   ├── hooks/ (5 custom hooks) ✅
│   │   ├── pages/ (15+ pages) ✅
│   │   ├── services/ (5 service files) ✅
│   │   ├── App.js ✅
│   │   ├── index.css ✅
│   │   └── index.js ✅
│   ├── .env (create from template)
│   ├── babel.config.js ✅
│   ├── package.json ✅
│   ├── postcss.config.js ✅
│   └── tailwind.config.js ✅
│
├── docs/
│   ├── API_DOCUMENTATION.md ✅
│   ├── DATABASE_SCHEMA_DOCUMENTATION.md ✅
│   ├── SETUP_GUIDE.md ✅
│   └── (source documents) ✅
│
├── .gitignore ✅
├── CHANGELOG.md ✅
└── README.md ✅
```

**Legend:**
- ✅ Complete and functional
- 🔨 Pending implementation

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

**Version**: 2.0  
**Last Updated**: March 2026  
**Status**: Production Ready 🚀  
**Ministry of Labour and Social Security - Kingdom of Eswatini

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Remove all test accounts from seeders
- [ ] Update environment variables for production
- [ ] Configure production database (PostgreSQL)
- [ ] Set up email service (SMTP credentials)
- [ ] Generate strong JWT secrets (minimum 32 characters)
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificates (HTTPS)
- [ ] Configure domain and DNS
- [ ] Review and update rate limits
- [ ] Enable production logging
- [ ] Set up database backups
- [ ] Configure file upload limits
- [ ] Review security headers (Helmet configuration)

### Deployment
- [ ] Deploy backend (PM2, Docker, or cloud platform)
- [ ] Deploy frontend (Netlify, Vercel, or static hosting)
- [ ] Run database migrations on production
- [ ] Seed production data (institutions, questions, occupations)
- [ ] Test all critical user flows
- [ ] Verify email sending works
- [ ] Test PDF generation
- [ ] Verify analytics and reporting
- [ ] Check mobile responsiveness

### Post-Deployment
- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Configure automated backups
- [ ] Document admin procedures
- [ ] Train system administrators
- [ ] Train test administrators/counselors
- [ ] Prepare user documentation
- [ ] Set up support channels