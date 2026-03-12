# Changelog

All notable changes to the SDS (Self-Directed Search) Assessment System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-03-12

### Added

#### Backend
- `backend/migrations/20260312180000-add-workplace-to-users.js` - Adds `workplace_institution_id` (FK → institutions) and `workplace_name` (string) columns to users table
- `GET /api/v1/institutions/search?q=` - Public endpoint for live institution search (returns up to 20 matches, used by workplace input)
- `workplaceInstitutionId` and `workplaceName` fields accepted in `POST /api/v1/auth/register` for Professional user type
- `workplaceInstitutionId` and `workplaceName` fields accepted in `PATCH /api/v1/auth/me` for profile updates
- `degreeProgram`, `yearOfStudy`, `yearsExperience` also now accepted by `PATCH /api/v1/auth/me`

#### Frontend
- `frontend/src/components/ui/WorkplaceSearchInput.jsx` - Reusable searchable workplace input: debounced live search against `/api/v1/institutions/search`, free-text fallback, institution match badge, clear button
- Workplace / Employer field added to `Register.jsx` for Professional users (step 2)
- Workplace / Employer field added to `Onboarding.jsx` step 2 for Professional users (replaces school/university field)
- Workplace / Employer field added to `Profile.jsx` Employment section for Professional users
- Academic Qualifications & Certificates section in `Profile.jsx` — drag-and-drop upload, document type/title/issuer/date metadata, list with view and delete actions

#### Backend — Qualification Upload
- `backend/migrations/20260312190000-create-user-qualifications.js` — `user_qualifications` table
- `backend/src/models/UserQualification.js` — Sequelize model; `User hasMany UserQualification`
- `backend/src/controllers/qualification.controller.js` — list, upload, stream file, delete
- `backend/src/routes/qualification.routes.js` — multer middleware (5 MB, PDF/JPEG/PNG/WebP), auth-gated routes
- `GET /api/v1/qualifications` — list authenticated user's uploaded documents
- `POST /api/v1/qualifications` — multipart upload (`file` field + title/documentType/issuedBy/issueDate body fields)
- `GET /api/v1/qualifications/:id/file` — stream file back (inline, authenticated)
- `DELETE /api/v1/qualifications/:id` — delete record + file from disk

#### Database
- `users.workplace_institution_id` (UUID, FK → institutions, nullable, indexed)
- `users.workplace_name` (string, nullable)
- `user_qualifications` table — stores uploaded qualification documents per user

### Changed
- `backend/migrations/20260126180200-create-users.js` — workplace columns merged directly into original migration; `20260312180000-add-workplace-to-users.js` alter migration deleted
- `backend/package.json` — added `multer` dependency for multipart file uploads

---

## [2.0.0] - 2026-03-12

### 🚨 BREAKING CHANGES

- **Role enum values changed** from snake_case (`admin`, `test_administrator`, `counselor`, `test_taker`, `user`) to readable display names (`System Administrator`, `Test Administrator`, `Test Taker`)
- **User type enum values changed** from snake_case to readable display names (`High School Student`, `University Student`, `Professional`, etc.)
- **All API endpoints** now return and expect new enum values in requests/responses
- **External API consumers** must update to use new enum values
- **Users may need to re-login** after deployment due to session changes
- **All legacy snake_case fallbacks removed** from codebase

### Added

#### Backend
- `backend/src/constants/roles.js` - Centralized role and user type constants
- `backend/migrations/20260312000001-add-must-change-password.js` - Password change enforcement for imported users
- `backend/migrations/20260312000002-create-subjects.js` - Dynamic subjects table with RIASEC mapping
- `backend/seeders/20260312000001-seed-subjects.js` - 25 default subjects seeded
- `backend/src/models/Subject.js` - Subject model with RIASEC codes
- `POST /api/v1/auth/change-password` - Endpoint for forced password changes
- Holland code tie handling with "/" separator (e.g., `R/S/E/C`)
- Dynamic subject loading from database in scoring service

#### Frontend
- `frontend/src/pages/ChangePassword.jsx` - Password change page for imported users
- `frontend/src/pages/QuestionnaireIntro.jsx` - Comprehensive assessment instructions page
- Route `/questionnaire-intro` - Pre-assessment instruction page
- Route `/change-password` - Password change flow
- Elapsed time timer (MM:SS format) in questionnaire
- Pause functionality for assessment timer
- Validation preventing incomplete assessment submission
- Section-specific instructions in questionnaire
- "Testee Number" label (replacing "Student Code" in UI)

#### Database
- `must_change_password` field in users table
- `subjects` table with RIASEC mapping
- 49 permissions across 13 modules
- 5 seeded users with new role/type values
- 25 seeded subjects

### Changed

#### Backend (12 files)
- `src/models/User.js` - Updated role and userType enums to readable values, added mustChangePassword field
- `src/middleware/authorization.middleware.js` - Uses ROLES constants from roles.js
- `src/routes/admin.routes.js` - Authorization uses new role values
- `src/controllers/auth.controller.js` - Register creates users with `role: 'Test Taker'`, login returns mustChangePassword flag
- `src/controllers/admin.controller.js` - All role queries, analytics, and createUser use new enum values
- `src/controllers/assessment.controller.js` - Authorization checks use new role values
- `src/controllers/certificate.controller.js` - Role checks use new values
- `src/controllers/counselor.controller.js` - All role queries use new values
- `src/routes/auth.routes.js` - Added change-password route
- `src/validations/auth.validation.js` - Added changePassword validation schema
- `src/services/studentImport.service.js` - Sets mustChangePassword flag, uses new enum values
- `src/services/scoring.service.js` - Holland code tie handling, dynamic subject loading
- `seeders/20260310200200-seed-users.js` - All users seeded with new enum values
- `seeders/20260312170000-seed-permissions.js` - Permission queries use new role values

#### Frontend (12 files)
- `src/App.js` - All allowedRoles arrays use new role values, added new routes
- `src/context/AuthContext.js` - roleDashboard() function uses new values
- `src/components/layout/AppShell.jsx` - ROLE_LABELS and ROLE_COLORS use new values only
- `src/components/layout/AssessmentShell.jsx` - Role checks and labels updated
- `src/components/ui/StatusIndicators.jsx` - RoleBadge supports new values only
- `src/pages/Login.jsx` - Post-login navigation uses new values, mustChangePassword redirect
- `src/pages/Profile.jsx` - ROLE_COLORS updated, navigation logic uses new values
- `src/pages/TestResults.jsx` - getDashboardPath() uses new values
- `src/pages/Unauthorized.jsx` - handleBack() uses new values
- `src/pages/TestAdministratorDashboard.jsx` - isAdmin check uses new values
- `src/pages/Questionnaire.jsx` - Added instructions, elapsed timer, pause, validation
- `src/features/admin/users/AdminUsersPanel.jsx` - Role dropdowns and filters use new values

#### Database Schema
- Role enum: `'System Administrator'`, `'Test Administrator'`, `'Test Taker'`
- User type enum: `'High School Student'`, `'University Student'`, `'Professional'`, `'Test Administrator'`, `'System Administrator'`

### Removed

- All legacy snake_case role values (`admin`, `test_administrator`, `counselor`, `test_taker`, `user`) from codebase
- All legacy snake_case user type values (`school_student`, `university_student`, `test_taker_school`, etc.) from codebase
- Legacy role fallbacks in frontend components
- Hardcoded subject lists (now database-driven)

### Fixed

- Holland code calculation now properly handles tied scores with "/" separator
- Assessment timer now pauses when test is paused
- Validation prevents submission of incomplete assessments
- Password change enforcement for counselor-created students
- Role-based authorization consistency across backend and frontend

### Security

- Password change requires current password verification
- Password validation enforced (8+ characters, letters + numbers)
- mustChangePassword flag cannot be bypassed
- All routes properly authenticated
- Role-based access control enforced with new values
- Permission system granular and secure (49 permissions across 13 modules)

---

## Database Migration

**Run migrations:**
```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**Expected state:**
- 5 users seeded (1 System Admin, 1 Test Admin, 3 Test Takers)
- 49 permissions seeded
- 25 subjects seeded
- All enum values updated to readable format

---

## API Changes

**Before:**
```json
{
  "role": "admin",
  "userType": "test_taker_school"
}
```

**After:**
```json
{
  "role": "System Administrator",
  "userType": "High School Student"
}
```

**Affected endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/analytics`
- All permission endpoints

---

## Deployment Notes

### Prerequisites
- Node.js 14+
- PostgreSQL database
- Environment variables configured

### Steps
1. Run database migrations
2. Run seeders
3. Restart backend server
4. Build and deploy frontend
5. Clear user sessions/cache

### Verification
- Backend models load successfully ✅
- Frontend builds without errors ✅
- No legacy role references in codebase ✅
- All tests pass ✅

### Rollback
Not recommended - breaking change. Fix issues forward.

---

## Performance Impact

- Minimal - one additional database query for subjects
- Holland code calculation slightly more complex but negligible
- No impact on existing features
- Build size optimized (392.37 kB gzipped)

---

## Backward Compatibility

- ✅ Existing users unaffected (mustChangePassword defaults to false)
- ✅ Existing assessments work with new Holland code format
- ✅ Subjects fallback gracefully if database empty
- ✅ All existing routes and functionality preserved
- ❌ Legacy role values NOT supported (breaking change)

---

## Support & Troubleshooting

### Common Issues

**Issue:** Users can't login after deployment
- **Solution:** Clear browser cache and cookies, re-login

**Issue:** Permissions not working
- **Solution:** Verify seeders ran: `SELECT COUNT(*) FROM permissions;`

**Issue:** Frontend shows old role names
- **Solution:** Hard refresh browser (Ctrl+Shift+R), clear cache

**Issue:** Database enum error
- **Solution:** Verify migrations ran: `SELECT * FROM "SequelizeMeta";`

### Database Verification Queries

```sql
-- Check enum values
SELECT typname, enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE typname IN ('enum_users_role', 'enum_users_user_type');

-- Check user distribution
SELECT role, user_type, COUNT(*) 
FROM users 
GROUP BY role, user_type;

-- Check permissions
SELECT module, COUNT(*) 
FROM permissions 
GROUP BY module;
```

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
