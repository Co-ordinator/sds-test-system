# PROJECT_CONTEXT.md

Project context for the SDS Test System. Future agents should read this before making changes.

## What The System Does

The SDS Test System is an online Self-Directed Search career assessment platform for Eswatini. It helps learners, tertiary students, and professionals complete an SDS/RIASEC questionnaire, receive a Holland Code profile, and view career, study, subject, funding-priority, and institution guidance.

The system also supports ministry/system administrators and school/institution test administrators with user management, imported learners, login cards, analytics, reports, certificates, and seeded reference data.

## Client-Approved UI Baseline

The client explicitly preferred the established/previous UI to the contributor's replacement design and requested that the redesign be reverted. The current UI is therefore the client-approved baseline, not an unfinished migration to the contributor design.

- Preserve the current landing page, navigation, dashboards, role journeys, layout language, and overall visual identity unless the client explicitly approves a new redesign.
- Functional, reliability, accessibility, security, and data-quality fixes from contributor work may be integrated without restoring the rejected visual redesign.
- Do not reapply commit `9338d29` (`new design`) or recreate its broad UI replacement by default.
- When resolving future conflicts, keep the current client-approved UI and port only compatible functional fixes.

## Target Users

- **High school learners**: complete assessment, receive Holland Code, career paths, recommended school subject focus, certificate/report.
- **University/tertiary students**: complete assessment, receive tertiary study/career guidance and opportunities relevant to their profile.
- **Professionals**: complete assessment, receive career/upskilling guidance; avoid high-school subject-only recommendations.
- **Test Administrators**: career guidance teachers/counselors at institutions/schools who can import learners, generate login cards, and view relevant results.
- **System Administrators**: ministry/system-level users who manage data, users, permissions, reports, institutions, questions, occupations, analytics, etc.

## Main Roles

Verified roles in code/docs:

- `System Administrator`
- `Test Administrator`
- `Test Taker`

Verified user types:

- `High School Student`
- `University Student`
- `Professional`
- `Test Administrator`
- `System Administrator`

## Role/Permission Behavior

- Frontend routes are protected by `ProtectedRoute` in `frontend/src/components/auth/ProtectedRoute`.
- Backend authentication uses JWT access tokens and refresh tokens.
- Backend role checks use `restrictTo`.
- Granular RBAC uses `requirePermission` in `backend/src/middleware/permission.middleware.js`, with permissions loaded from the database.
- Test Administrator is functionally the counselor/career guidance teacher for an assigned institution. Assigned institution should be read-only in self-profile.
- Test takers should only access assessment functionality after onboarding completion.

## Main Modules And Features

### Public/Authentication

- Landing page, About, Help, Login, Register.
- Registration captures first name, surname, national ID, email, password, consent.
- Email verification is OTP-based.
- Forgot password is OTP-based.
- Password rule: minimum 6 characters, any characters allowed.
- Login supports email/username/participant code style identifiers.
- Imported learner login cards support learners without email accounts.

### Onboarding/Profile

- Onboarding captures role-specific profile data after email OTP verification.
- Name/surname are captured at registration, so onboarding should not ask for them again.
- High school learners select region and school/institution data.
- Tertiary students select tertiary institutions; selection should not be over-constrained by home region.
- Professionals use workplace/employer, occupation, years of experience, and qualification-oriented data.
- Profile page is role-aware.

### Assessment

- SDS questionnaire has 4 sections:
  - Activities
  - Competencies
  - Occupations
  - Self-Estimates
- Uses Holland/RIASEC categories: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.
- Skipped-question panel appears when user clicks Submit and skipped questions exist.
- No "Skip for now" option should appear; the panel is for accidental skipped questions.
- On mobile, skipped-question popup should not block answering; it should appear at top/allow answering below.
- Submit button should show once all skipped questions are answered.
- Glossary terms should show definitions during assessment and support voice reading.

### Results/PDF/Certificates

- Results show Holland Code, interpretation, career recommendations, study pathways, subjects, funding alignment, and certificates.
- Codes with ties use `/`, e.g. `I A R/C`, and interpretation should show tied themes rather than dropping them.
- Career options should be human-friendly. Avoid raw labels like `All Other Mathematical Scientists` or `n.e.c.` without clarification.
- Assessment PDF report should be clean, professional, at most 4 pages, using key information only.
- Current PDF renderer: `backend/src/utils/resultsPdfRenderer.js`.
- Certificates use backend PDF assets and watermark from `frontend/public/watermark`/backend assets depending on deployment.
- Certificate wording is role-aware: professionals use occupation/workplace/location rather than student institution fields.
- New assessment completions snapshot non-sensitive certificate profile context so later profile edits cannot rewrite an older certificate. Legacy completed assessments fall back to current profile data.

### Glossary

- Glossary includes SDS terms, Datamatics list of terms, and extra terms from recent work.
- Terms such as Host/hostess, Handicapped, Shorthand, Humorous, Logarithmic table, and Keypunch were added/requested.
- Glossary filtering must be accurate.
- Glossary terms are used on the glossary page and in questionnaire text highlighting/tooltips/voice support.

### Admin Dashboard / Analytics

- Separate analytics tab was merged into admin dashboard/dashboard overview concept.
- Admin dashboard should use real data only; no dummy graphs or hard-coded fake insights.
- Filters should affect KPIs and graphs, including institution and institution type filters.
- Institution KPI should account for schools, universities, colleges, TVET, and other types rather than only school/university.

### Test Administrator / Counselor Tools

- Test Administrator imports learners via CSV.
- Import should use seeded institutions and support tolerant institution-name matching.
- Import must associate region and institution from the matched school/institution.
- Imported learner login cards must include name, login number, and temporary password.
- Learners who login from cards should change password when required and should not lose institution/region data.
- For imported learners with complete demographic/import fields, onboarding may be considered complete, but only if required data is present.

### Data Management/Seeded Reference Data

Important seed data completed during the long thread:

- Schools from four Eswatini region Word docs.
- Tertiary institutions from a doc.
- Priority list from docs/excel for funding/high priority fields.
- Holland occupational codes from Dictionary of Holland Occupational Codes source book.
- Datamatics glossary terms.
- Extra glossary terms.

## Business Rules

- Users are split into three test taker groups: high school learner, tertiary/university student, professional.
- Recommendations must differ by group:
  - High school: subjects, courses, career paths.
  - Tertiary: tertiary courses/opportunities and post-tertiary pathways.
  - Professional: career/upskilling, postgraduate options, jobs; do not suggest high-school subjects as primary guidance.
- Career recommendations must align with Holland Code. Avoid mismatches such as science codes producing unrelated cooking recommendations.
- Region-school filtering applies for high school school search where appropriate, but tertiary institution selection should be looser and not restricted by home region.
- Onboarding cannot be bypassed by going back to login after OTP verification.
- Required onboarding fields must block progression.
- Existing incomplete accounts should be audited/reportable; do not mutate production users automatically without approval.
- Accessibility settings are per-account and must not leak between users on the same browser/session.
- Screen reader mode should use the same voice behavior as glossary narration.

## Current Project Status

As of the 2026-07-10 assessment reliability update:

- The connected PostgreSQL database has the `assessments.certificate_profile_snapshot` migration applied. The assessment schema also has `holland_code_display`.
- A start/resume failure was traced to Sequelize selecting optional certificate/display fields from an environment whose schema had not been verified. Assessment lifecycle queries now explicitly select only the stable base assessment columns.
- Scoring and certificate services detect whether optional assessment columns exist before reading or writing them. This keeps assessment access available during a staged deployment, while still using certificate snapshots once migrations are applied.
- Any backend deployment must run `npm run migrate --prefix backend` before serving the updated code, then verify with `npm run db:verify --prefix backend`.

As of the 2026-06-30 recovery session:

- The project is actively evolving.
- The working tree had uncommitted changes from recent work around email templates, password validation, auth/rate limiting, result PDF renderer, docs, profile/auth pages, and backend email/admin/student import paths.
- Future agents must inspect `git status` before editing or committing.
- Do not assume current local `.env` values are safe to display or commit.
- A downloaded Render PostgreSQL backup folder `2026-06-27T1327Z.dir` was confirmed as a directory-format dump and restored through Docker/PostgreSQL 18.
- A plain local `backup.sql` was generated from the restored Docker database, restore-tested, and used to repopulate the new Render PostgreSQL database `sds_labour`.
- The Render database now contains the restored SDS data and passed `npm run db:verify --prefix backend`.
- Local `backend/.env` now points to the hosted Render database rather than the Docker restore database. Docker Postgres was stopped after verification, but its local restore volume may still exist.
- `hostinger env.txt` is an untracked local env handoff file containing Hostinger backend env values; do not commit it or expose its secrets.

## Known Completed Work From Thread

- Landing page redesigned several times and then client became used to current style; avoid drastic landing-page changes without confirmation.
- Login/register/reset pages redesigned and mobile-adjusted.
- Startup/loading screen added with centered logo and rotating circle.
- Learn More button routes to Help.
- Help/About content reorganized.
- Footer Datamatics link should point to `datamatics.co.sz` where applicable.
- OTP registration flow implemented.
- Forgot-password OTP flow implemented.
- Email templates professionalized and sender changed to `notificationsdatamatics@gmail.com`.
- IP/auth rate blockers were relaxed/removed for auth routes.
- Password rule changed to minimum 6 characters and any characters allowed.
- Onboarding bypass fixed and required fields strengthened.
- High school and tertiary institutions seeded from docs.
- Admin dashboard institution filters investigated/fixed.
- Test admin learner import and login card password display fixed.
- Imported learner profile institution/region issue fixed.
- Accessibility settings investigated and completed end-to-end.
- Assessment skipped-question panel added/reworked.
- Glossary filtering was worked on and extra terms added.
- Result PDF renderer was remade to clean professional document style.

## Important Workflows

### Self-Registration

1. User registers with name, surname, national ID, email, password, consent.
2. Backend creates account and sends email OTP.
3. User enters OTP on `/verify-otp`.
4. User completes onboarding.
5. User reaches dashboard and can start/resume assessment.

### Password Reset

1. User requests reset with email/SDS code.
2. Backend sends reset OTP.
3. User enters OTP and new password.
4. New password must be at least 6 characters; any characters are allowed.

### Imported Learner

1. Test Administrator imports CSV for assigned institution or supplied institution ID.
2. System matches institution and stores learner data, institution, region, student code.
3. Test Administrator generates login cards.
4. Learner logs in with login number and temporary password.
5. Learner changes password if required.
6. Learner should have name, institution, and region already available for dashboard/reporting/certificate.

### Assessment Completion

1. User answers questions.
2. On Submit, system checks skipped questions.
3. If skipped questions exist, panel shows skipped question numbers and quick jump.
4. User answers skipped questions.
5. Submit works normally when no skipped questions remain.
6. Results, certificate, and PDF report become available.

### Hosting/Deployment

1. Set backend and frontend env vars.
2. For the current recovered Render database, use the restored `sds_labour` PostgreSQL service and SSL-enabled connection settings.
3. Run migrations/seeders only when intentionally applying new schema or reference-data changes; do not blindly reseed restored production data.
4. Verify seed integrity.
5. Ensure PDF assets are deployed with backend.
6. Test registration OTP, login, onboarding, assessment, results PDF, certificate.

## Client/Stakeholder Requirements Preserved

- Interface should be neat, professional, compact, mobile responsive, and consistent across the system.
- Landing page should remain recognizable to client but avoid looking too dark or childish.
- Ministry wording should be visible and professional.
- Use logo letterhead throughout the system.
- System users are majority mobile phone users; mobile UX matters.
- PDFs and certificates must look official and professional.
- Reports must avoid clamped text, childish cards/backgrounds, and excessive colors.
- No dummy data or fake insights in admin dashboards/graphs.
- Email should look professional and not suspicious.
- Email sender should be relevant to Self-Directed Search System.
- Seeded reference documents should stay in repo so collaborators understand data sources.

## Unconfirmed / Needs Verification

- Exact current production hosting topology and Node startup command.
- Whether all older docs have been fully updated from token-link verification to OTP verification.
- Whether Gmail inbox placement has improved; provider spam classification is outside application control.
- Exact current public API base in production; older docs mention `api.sds-test.gov.sz`, while the current thread used Hostinger URL for frontend.
