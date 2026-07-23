# SDS Test System Changelog

## 2026-07-23

### Client-Preferred UI Baseline

- Reverted the contributor's broad replacement design because the client explicitly preferred the established/previous UI.
- Confirmed the current landing page, navigation, dashboards, role journeys, and visual language as the client-approved baseline.
- Retained and reconciled compatible functional QA fixes without reintroducing the rejected redesign.
- Documented that future conflict resolution must preserve the approved UI unless the client explicitly authorizes another redesign.

### QA Remediation And Reliability

- Completed the applicable SDS QA remediation across authentication, profiles, assessment progress, analytics, institution scoping, login cards, FAQs, reporting, certificates, email templates, and data cleanup.
- Added per-device refresh-token sessions so multiple trainees can use a shared account without one login invalidating the others.
- Prevented anonymous startup checks from redirecting the public landing page to login.
- Reduced notification polling and analytics query pressure observed in the hosted logs.
- Added the national age-group distribution chart and preserved school-scoped Test Administrator behavior.
- Updated certificate and results-PDF branding to `Pre-Service Tertiary Education & Training`.
- Added the required non-destructive migrations and focused regression coverage.

### Verification

- Applied all pending local migrations and passed database verification.
- Passed backend and frontend automated tests and production builds.
- Verified the frontend and backend services locally without browser automation.

## 2026-07-10

### Assessment Reliability And Certificate Schema

- Fixed `Failed to start assessment` / resume failures caused by an assessment model selecting optional columns from a database that had not yet received the matching migration.
- Applied the non-destructive `20260710110000-add-certificate-profile-snapshot-to-assessments` migration to the connected PostgreSQL database.
- Updated assessment lifecycle reads and creation responses to use only stable base assessment columns, preventing optional certificate fields from blocking Start or Resume.
- Added schema-aware handling in scoring and certificate services: optional Holland display and certificate snapshot fields are used when present and safely omitted when a staged deployment has not applied them yet.
- Added focused lifecycle compatibility tests for both starting a new assessment and resuming an existing assessment.

### Verification

- Passed focused assessment, scoring, certificate, and PDF test suites (25 tests).
- Passed backend build and database seed-integrity verification.

## 2026-06-04

### Backend PDF Assets
- Added the required PDF/certificate images under `backend/assets` so hosted backend deployments include the letterhead, Siyinqaba crest, and watermark without manual copying.
- Updated backend PDF asset resolution to check backend assets, built `dist/assets`, frontend public assets, docs assets, and optional environment overrides.
- Updated the backend build script so `letterhead.png`, `siyinqaba.png`, and `watermark.png` are copied into `backend/dist/assets`.
- Documented the deployment rule that PDF/certificate images are backend runtime assets, not only frontend static files.

## 2026-05-26

### Startup Loading Experience
- Added a branded startup screen so users no longer see a blank page while the app initializes.
- Added a static pre-React loading state in `frontend/public/index.html` so the loader appears before the React bundle finishes loading.
- Added a React startup screen in `frontend/src/components/ui/StartupScreen.jsx` for the auth session check.
- Updated auth initialization to show the startup screen while `/api/v1/auth/me` checks the current session.
- Updated the loader design to use the ministry letterhead logo with a clean rotating tricolor ring.

### Login Page Copy
- Replaced the login panel title from "Continue your career assessment" to "Access Your Account".
- Broadened the login supporting text to cover dashboard access, continuing assessments, viewing results, and profile management.

### Region And Town Filtering
- Added a shared Eswatini location dataset in `frontend/src/data/eswatiniLocations.js`.
- Updated onboarding so the Town / City suggestions filter by the selected region.
- Updated profile editing so District / Town suggestions also filter by the selected region.
- Centralized region label/backend value handling so onboarding and profile use the same location source.

### Deployment Notes
- No database migration or seed step is required for these changes.
- Rebuild and redeploy the frontend so the startup screen and filtered location dropdowns are included in the hosted build.

## 2026-05-13

### Reference Data And Seeding
- Added region source documents for Hhohho, Lubombo, Manzini, and Shiselweni high schools under `docs/`.
- Added the tertiary institutions source document under `docs/`.
- Added extracted JSON datasets for high schools and tertiary institutions so collaborators can inspect the data used by the seeders.
- Added an idempotent high-school seeder that seeds schools by region, remaps user and school-student references, and archives obsolete school placeholders as `other`.
- Added an idempotent tertiary-institution seeder that canonicalizes universities, colleges, TVET, and vocational institutions, remaps references, and archives duplicate or obsolete tertiary placeholders as `other`.

### Authentication And OTP Flow
- Replaced registration email verification links with an OTP-based verification flow.
- Added resend timing support for email verification OTPs.
- Updated forgot-password/reset-password to use OTP email verification as well.
- Added password reset OTP email template and tracking fields for reset-send timing.
- Updated auth screens around login, registration, verification, resend, forgot password, and reset password to use the newer auth flow and shared auth layout.

### Institution Onboarding
- Updated institution search/filtering so high-school users only see schools and tertiary users only see tertiary institution types.
- Added region-aware school search for high-school onboarding so school suggestions match the selected region.
- Kept tertiary institutions available for university/tertiary onboarding without mixing them into high-school suggestions.

### Admin Dashboard And Analytics Filters
- Merged the admin dashboard/analytics flow so the dashboard overview receives filtered analytics data.
- Fixed `Institution Type` filtering at the analytics query root by qualifying joined columns that became ambiguous once institution joins were applied.
- Updated the Institutions KPI to use the institution catalog count and type breakdown, not only institutions with assessment records.
- Added institution breakdown data to dashboard fetches so institution, institution type, region, user type, and date filters stay consistent across overview KPIs and usage tables.
- Filtered the Institution dropdown by selected Institution Type and Region to avoid conflicting filter combinations.

### UI And Experience Updates
- Updated login and registration pages with the newer auth shell.
- Added password visibility controls and relaxed registration password validation to allow stronger passwords with special characters.
- Updated landing/help routing so `Learn more` opens the help page.
- Removed the cancel action from the skipped-question submit popup and kept the prompt active until skipped questions are answered.

### Deployment Notes
- For a fresh database, run `cd backend`, then `npm run migrate`, then `npm run seed`.
- For an existing hosted database that already has earlier seeders, run the two new migrations and then run the 2026-05-13 school and tertiary seeders, or run `npm run seed` if the environment has not applied them before.
- The 2026-05-13 institution seeders are designed to preserve references by remapping users, workplace links, school-student rows, and course-institution rows before archiving duplicates/placeholders.

## 2026-04-16

### Registration and Email Verification
- Fixed registration failures caused by encrypted `nationalId` being validated as plaintext in the user model.
- Added explicit duplicate email checks during registration and mapped ORM uniqueness/validation errors to user-friendly API responses.
- Improved frontend registration error handling to show normalized backend messages and field-level validation feedback instead of generic failure text.
- Updated verification-link base URL resolution to avoid `localhost` links in production when forwarded host/protocol is available.

### Auth/API Reliability
- Improved backend CORS origin handling to support configured allowlists and local development defaults.
- Improved frontend API base URL fallback logic so production builds do not silently fall back to `http://localhost:5000`.
- Updated auth-related screens (register, forgot password, reset password, verify email, resend verification) to use normalized API errors consistently.

### UI Text and Encoding Cleanup
- Fixed corrupted mojibake icon/text bytes in the results UI (for example `ðŸ“ˆ`, `ðŸ“Š`, `ðŸ”§`, `ðŸ”¬`).
- Restored proper result icons (`📈`, `📊`, `🔧`, `🔬`, `🎨`, `🤝`) and cleaned corrupted separators/bullets/labels.
- Cleaned corrupted helper text characters in occupation search input messaging.

### PDF Report and Tie-Code Output
- Updated Holland code scoring/output to preserve ties using `/` (for example `R/I A S`) for both API display and generated reports.
- Updated assessment PDF generation to render tied Holland code groups exactly as displayed in results, with cleaner layout and page numbering.
- Updated certificate and analytics/admin PDF headers to a consistent centered government header format and added page number footers.
