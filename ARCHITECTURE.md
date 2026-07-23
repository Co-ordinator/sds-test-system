# ARCHITECTURE.md

Architecture notes for the SDS Test System.

## High-Level Architecture

The application is a two-tier web system:

- **Frontend SPA**: React app in `frontend/`, served to users and communicating with backend APIs.
- **Backend API**: Express app in `backend/`, providing authentication, assessment, scoring/recommendations, admin tools, reporting, PDF/certificate generation, and database access.
- **Database**: PostgreSQL, accessed through Sequelize models/migrations/seeders.

Typical flow:

1. Browser loads React app.
2. React app calls `/api/v1/...` endpoints using axios.
3. Backend validates request with Joi, verifies JWT/cookies, checks role/permissions, runs service logic.
4. Backend reads/writes PostgreSQL through Sequelize.
5. Backend returns JSON or generated PDFs.

## Frontend Structure

Key files/folders:

- `frontend/src/index.js` - React entry.
- `frontend/src/App.js` - routes and top-level providers.
- `frontend/src/context/AuthContext.js` - auth/session state.
- `frontend/src/context/PermissionContext.js` - permission state.
- `frontend/src/context/AccessibilityContext.js` - accessibility preferences, screen reader announcements, voice behavior.
- `frontend/src/components/auth/ProtectedRoute` - role/onboarding/must-change-password route guard.
- `frontend/src/components/layout/` - app shell/side nav/header layout.
- `frontend/src/pages/` - public, test taker, admin, counselor, auth, profile, assessment pages.
- `frontend/src/pages/admin/` - admin sub-pages.
- `frontend/src/features/` - feature-level panels for admin, analytics, counselor, etc.
- `frontend/src/services/` - axios API wrappers.
- `frontend/src/theme/government.js` - government/ministry UI constants.
- `frontend/src/hooks/useGlossary.js` and `frontend/src/components/ui/SmartTextHighlighter.jsx` - glossary highlighting behavior.

Important frontend routes from `App.js`:

- Public: `/`, `/about`, `/help`, `/register`, `/login`, `/forgot-password`, `/reset-password/:token`, `/verify-otp`.
- Test taker: `/dashboard`, `/questionnaire-intro`, `/questionnaire`, `/test-complete`, `/results`, `/profile`, `/glossary`, `/accessibility`.
- Admin: `/admin`, `/admin/dashboard`, `/admin/users`, `/admin/institutions`, `/admin/subjects`, `/admin/occupations`, `/admin/results`, `/admin/reports`, `/admin/audit`, `/admin/settings`, `/admin/courses`, `/admin/education-levels`, `/admin/certificates`, `/admin/notifications`.
- Test administrator/counselor: `/test-administrator/*` and legacy `/counselor/*`.

## Backend Structure

Key files/folders:

- `backend/server.js` - starts server.
- `backend/src/app.js` - Express app, middleware and route mounting.
- `backend/src/routes/` - API endpoint grouping.
- `backend/src/controllers/` - request/response coordination.
- `backend/src/services/` - business logic.
- `backend/src/models/` - Sequelize models.
- `backend/src/middleware/` - auth, permissions, validation, logging, rate limiting, errors.
- `backend/src/validations/` - Joi validation schemas.
- `backend/src/config/` - database, email, app config.
- `backend/src/templates/emails/` - handlebars email templates.
- `backend/src/utils/` - PDF assets, report rendering, security utilities, logging helpers.
- `backend/scripts/` - build, data, audit, verification, cleanup helper scripts.
- `backend/migrations/` - Sequelize schema migrations.
- `backend/seeders/` - reference data seeders.

Backend route mounting in `backend/src/app.js`:

- `/api/v1/auth`
- `/api/v1/admin`
- `/api/v1/assessments`
- `/api/v1/results`
- `/api/v1/institutions`
- `/api/v1/counselor`
- `/api/v1/qualifications`
- `/api/v1/occupations`
- `/api/v1/education-levels`
- `/api/v1/analytics`
- `/api/v1/courses`
- `/api/v1/reports`
- `/api/v1/glossary`

## Database Structure

See `docs/DATABASE_SCHEMA_DOCUMENTATION.md` for detailed schema.

Core models verified in `backend/src/models/`:

- `User`
- `Permission`
- `UserPermission`
- `Assessment`
- `Answer`
- `Question`
- `Institution`
- `SchoolStudent`
- `EducationLevel`
- `Subject`
- `Occupation`
- `Course`
- `CourseRequirement`
- `CourseInstitution`
- `OccupationCourse`
- `GlossaryTerm`
- `Certificate`
- `AuditLog`
- `UserQualification`

Important schema behaviors:

- Users can be staff or test takers.
- Test taker profile fields differ for high school, university, and professional users.
- `User` model encrypts national ID and stores a hash for lookup/uniqueness.
- Password hashing happens in Sequelize hooks.
- Assessments store RIASEC scores and Holland Code.
- Institutions include schools, universities, colleges, TVET, and other institution types.
- Course/institution/occupation linking supports recommendations.
- User qualifications upload metadata points to files under backend uploads.

## Authentication And Authorization Flow

### Auth Flow

- Registration endpoint: `POST /api/v1/auth/register`.
- Verification endpoint: `POST /api/v1/auth/verify-email`.
- Resend OTP endpoint: `POST /api/v1/auth/resend-verification`.
- Login endpoint: `POST /api/v1/auth/login`.
- Forgot password endpoint: `POST /api/v1/auth/forgot-password`.
- Reset password with OTP endpoint: `POST /api/v1/auth/reset-password-otp`.
- Change password endpoint: `POST /api/v1/auth/change-password`.

Current business decision:

- Email verification uses OTP, not a verification link.
- Password reset uses OTP.
- Passwords require at least 6 characters and allow any characters.

### Tokens/Cookies

- JWT access token is verified by `verifyToken` in `backend/src/middleware/authentication.middleware.js`.
- `verifyToken` reads `Authorization: Bearer <token>` or `accessToken` cookie.
- Refresh-token rotation exists in auth service/controller.
- `JWT_EXPIRE` default example is `15m`.
- Cookie SameSite policy is controlled by `COOKIE_SAMESITE`.

### Onboarding Gate

- `requireCompletedOnboarding` in `authentication.middleware.js` blocks test takers from assessment access if `onboardingCompleted` is false.
- Frontend `ProtectedRoute` also handles onboarding/must-change-password routing.

### Authorization

- Role-level checks use `restrictTo`.
- Permission-level checks use `requirePermission` in `backend/src/middleware/permission.middleware.js`.
- Permissions are loaded from DB via `User` -> `Permission` relationship.
- Denied permission attempts create `AuditLog` records.

## API Structure

The backend is REST-style JSON API under `/api/v1`.

Important groups:

- `auth.routes.js`: registration, OTP verification, login, profile, password recovery, logout.
- `assessment.routes.js`: start/list/get/progress/submit/results/PDF/certificate for test takers.
- `result.routes.js`: result view/PDF with permission checks.
- `admin.routes.js`: users, permissions, questions, imports, analytics/admin operations.
- `counselor.routes.js`: test administrator learner import/login cards/scope.
- `institution.routes.js`: institutions and search.
- `occupation.routes.js`: occupations and search.
- `course.routes.js`: courses.
- `glossary.routes.js`: glossary data.
- `analytics.routes.js`: dashboard analytics/export.
- `report.routes.js`: admin report generation/export.
- `qualification.routes.js`: user qualification uploads.

## Important Dependencies

Backend:

- `express`, `sequelize`, `pg`
- `jsonwebtoken`, `bcryptjs`, `cookie-parser`
- `joi`
- `helmet`, `cors`, `express-rate-limit`
- `multer`
- `nodemailer`, `nodemailer-express-handlebars`
- `pdfkit`
- `winston`
- `csv-parse`, `json2csv`

Frontend:

- `react`, `react-dom`, `react-router-dom`
- `axios`
- `react-hook-form`, `joi`
- `lucide-react`
- `recharts`
- `leaflet`, `react-leaflet`
- `tailwindcss`

## Integration Points

### Email

- Config: `backend/src/config/email.config.js`.
- Templates: `backend/src/templates/emails/*.hbs`.
- Current sender: `notificationsdatamatics@gmail.com`.
- OTP and account emails should use professional Self-Directed Search System wording.
- Keep `SMTP_USER`, `SMTP_FROM_EMAIL`, and `SMTP_REPLY_TO` aligned when using Gmail.

### PDF Reports And Certificates

- Results PDF renderer: `backend/src/utils/resultsPdfRenderer.js`.
- Certificate controller: `backend/src/controllers/certificate.controller.js`.
- Role-aware certificate statement builder: `backend/src/utils/certificateRecipient.js`.
- Certificate context snapshot builder: `backend/src/utils/certificateProfileSnapshot.js`.
- Asset resolver: `backend/src/utils/pdfAssets.js`.
- Required assets: `letterhead.png`, `siyinqaba.png`, `watermark.png`.
- Asset lookup includes backend assets, frontend public, docs, and env-provided paths.
- `assessments.certificate_profile_snapshot` stores non-sensitive institution or professional context at first completion. Certificate rendering uses this immutable snapshot when present and falls back to the live profile only for legacy assessments.

### Uploads

- User qualification uploads use backend storage under `backend/uploads/qualifications/`.
- `.gitignore` ignores upload contents but keeps directory structure with `.gitkeep`.
- Allowed file types include PDF/JPEG/PNG/WebP and size limit is documented in database docs.

### Seeded Reference Data

Seeders are integration points with source docs in `docs/`:

- high schools by region
- tertiary institutions
- priority list/funding alignment
- Datamatics glossary terms
- Holland occupation data
- courses, subjects, institutions, questions

## Reporting/Export Logic

- Assessment PDF: `GET /api/v1/assessments/:assessmentId/pdf` and `GET /api/v1/results/:assessmentId/pdf`.
- Admin analytics export: `backend/src/controllers/analytics.controller.js`.
- Admin reports: `backend/src/controllers/report.controller.js`.
- Login cards: `backend/src/controllers/counselor.controller.js`.
- Certificates: `backend/src/controllers/certificate.controller.js`.

Current report preference:

- Results PDF should look like a clean official document, not card-heavy UI.
- Max 4 pages.
- No clamped text.
- Use tables, restrained colors, clear official footer.

## Technical Constraints

- Backend is CommonJS.
- Frontend is Create React App; avoid introducing build tooling without approval.
- PostgreSQL/Sequelize migrations must preserve production data.
- Do not rely on browser static assets only for backend-generated PDFs; backend needs filesystem access to assets.
- Hosted DB may differ from local DB; migrations/seeders must be safe for shared data.
- Email inbox placement depends on provider reputation; code can reduce suspicious formatting but cannot guarantee Gmail Primary inbox.
- Some older docs may have stale API/auth details; inspect code before relying on docs.

## Unconfirmed / Needs Verification

- Exact current hosted backend runtime command.
- Whether all production environments set `trust proxy`; if many users share proxy IPs, non-auth rate limiting may be affected.
- Whether public production API base is separate from Hostinger frontend URL.
