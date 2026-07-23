# AGENTS.md

Instructions for future AI coding agents working on the SDS Test System.

## Project Name And Purpose

**Online SDS Test System**.

This is a Self-Directed Search career assessment platform for the Ministry of Labour and Social Security, Kingdom of Eswatini. The system administers an SDS/RIASEC questionnaire, produces Holland Code results, recommends career and study pathways, supports glossary/accessibility assistance during testing, and provides admin/counselor tools for institutions, reporting, imported learners, login cards, certificates, and analytics.

Primary branding used in current UI work:

- **Self-Directed Search (SDS)**
- **Ministry of Labour: Measurement and Testing Unit**
- **SDS Career Assessment System / SDS Test System**
- Powered by Datamatics Eswatini where the footer requires attribution.

## Tech Stack

Verified from package files:

- Monorepo: npm workspaces, Turborepo.
- Frontend: React 19, React Router 7, Create React App/react-scripts, Tailwind CSS, lucide-react, react-hook-form, axios, Recharts, Leaflet/react-leaflet.
- Backend: Node.js CommonJS, Express 5, Sequelize 6, PostgreSQL, Joi, JWT, bcryptjs, cookie-parser, helmet, express-rate-limit, multer, nodemailer + handlebars templates, pdfkit, Winston logging.
- Testing: Jest/Supertest on backend, react-scripts test on frontend. Existing tests are in `backend/tests/` and `frontend/src/services/errorNormalizer.test.js`.
- PDF generation: `pdfkit`.
- Database migrations and seeders: `sequelize-cli`.

## Local Run Commands

From repo root:

```bash
npm install
npm run dev
```

The root `dev` command runs `turbo run dev`, which starts workspace dev scripts. If that is inconvenient, run services separately:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm start
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/health`
- API base: `http://localhost:5000/api/v1`

## Build Commands

From repo root:

```bash
npm run build
```

Per workspace:

```bash
npm run build --prefix frontend
npm run build --prefix backend
```

Important backend build behavior:

- `backend/scripts/build.js` copies `src/**/*.js`, `server.js`, `src/templates`, and backend PDF assets into `backend/dist`.
- Required PDF/certificate assets are `letterhead.png`, `siyinqaba.png`, and `watermark.png`.
- Backend build searches for PDF assets in `backend/assets`, then `frontend/public`, then `docs`, and copies them into `backend/dist/assets`.
- Certificate recipient wording is role-aware through `backend/src/utils/certificateRecipient.js`; professionals must never fall back to student institution wording.
- New assessment completions persist non-sensitive certificate context in `assessments.certificate_profile_snapshot`; legacy null snapshots fall back to the live profile.

## Test And Check Commands

Backend:

```bash
npm test --prefix backend
npm run test:error-contract --prefix backend
npm run check:no-console --prefix backend
npm run db:verify --prefix backend
npm run audit:onboarding --prefix backend
```

Frontend:

```bash
npm test --prefix frontend
npm run build --prefix frontend
```

Syntax checks often used for targeted backend edits:

```bash
node --check backend/src/path/to/file.js
```

Database commands:

```bash
npm run migrate --prefix backend
npm run seed --prefix backend
npm run db:verify --prefix backend
```

Dangerous command:

```bash
npm run db:reset --prefix backend
```

Do not run `db:reset` against production or any shared database.

## Important Folder Structure

Root:

- `frontend/` - React app.
- `backend/` - Express API, Sequelize models, migrations, seeders, PDF/email generation.
- `docs/` - long-form setup, API, database, SRS, design docs, change log, reference docs.
- `logs/` - local logs, ignored by git.

Backend:

- `backend/server.js` - backend process entry.
- `backend/src/app.js` - Express app, middleware, route mounting.
- `backend/src/routes/` - API route definitions.
- `backend/src/controllers/` - HTTP controllers.
- `backend/src/services/` - business logic, scoring, imports, reports.
- `backend/src/models/` - Sequelize models.
- `backend/src/middleware/` - auth, permissions, validation, rate limiting, logging, errors.
- `backend/src/validations/` - Joi request schemas.
- `backend/src/templates/emails/` - email HTML templates.
- `backend/src/utils/resultsPdfRenderer.js` - assessment result PDF renderer.
- `backend/src/utils/pdfAssets.js` - PDF/certificate asset resolution.
- `backend/assets/` - backend-readable PDF/certificate assets.
- `backend/migrations/` - schema migrations.
- `backend/seeders/` - reference data seeders.
- `backend/uploads/qualifications/` - uploaded qualification documents; contents ignored except `.gitkeep`.

Frontend:

- `frontend/src/App.js` - route configuration and route announcer for screen reader mode.
- `frontend/src/pages/` - main route pages.
- `frontend/src/pages/admin/` - admin pages.
- `frontend/src/components/` - shared UI, auth, layout, onboarding components.
- `frontend/src/features/` - admin/counselor/analytics feature panels.
- `frontend/src/context/` - auth, permissions, accessibility state.
- `frontend/src/services/` - API wrappers.
- `frontend/src/theme/` - government UI constants.
- `frontend/public/` - static frontend assets.

## Database Details

- Database: PostgreSQL.
- ORM: Sequelize.
- Primary connection logic: `backend/src/config/database.config.js`.
- Production/shared DB should use `DATABASE_URL`.
- Local DB may use `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Render-hosted PostgreSQL requires SSL in practice. Code auto-enables SSL when the DB host/URL includes `render.com` or `NODE_ENV=production`, unless env overrides are set.
- National IDs are encrypted/hashed in `User` model via `DATA_ENCRYPTION_KEY`; never change this key casually after users exist.
- User passwords are bcrypt-hashed by model hooks.

Seeders include core reference data:

- education levels
- institutions, high schools, tertiary institutions
- school students/demo data
- subjects
- courses and requirements
- permissions
- questions
- occupations, Holland-book occupation data, occupation-course links
- Datamatics glossary terms and extra glossary terms
- priority list and funding alignment data

## Environment Variables

Use `backend/.env.example` and `frontend/.env.example` as the source of truth. Important backend variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sds_test_system
DB_USER=postgres
DB_PASSWORD=change_me
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
TEST_DATABASE_URL=
JWT_SECRET=change_this_to_a_minimum_32_character_secret
JWT_REFRESH_SECRET=change_this_to_a_different_32_character_secret
JWT_EXPIRE=15m
DATA_ENCRYPTION_KEY=change_this_to_a_32_byte_base64_or_hex_key
COOKIE_SAMESITE=strict
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notificationsdatamatics@gmail.com
SMTP_PASS=
SMTP_FROM_EMAIL=notificationsdatamatics@gmail.com
SMTP_FROM_NAME=Self-Directed Search System
SMTP_REPLY_TO=notificationsdatamatics@gmail.com
```

Frontend:

```env
REACT_APP_API_URL=
REACT_APP_NAME=SDS Test System
```

Local frontend can leave `REACT_APP_API_URL` empty and use the CRA proxy to `http://localhost:5000`.

Do not commit real `.env` files or secrets.

## Deployment And Hosting Notes

- Current known hosting target from the thread: Hostinger frontend/site URL `https://brown-cobra-764328.hostingersite.com`.
- Render PostgreSQL has been used as a remote database. Do not hard-code remote DB credentials in docs or code.
- 2026-06-30 database recovery: the downloaded Render directory-format backup `2026-06-27T1327Z.dir` was verified as a PostgreSQL dump from database `sds_test_db_s5ki`, restored locally through Docker/PostgreSQL 18, exported to local `backup.sql`, and restored into the new Render PostgreSQL database `sds_labour`.
- The restored Render database was verified with row counts and `npm run db:verify --prefix backend`. The external Render connection requires SSL; local `.env` uses `DATABASE_URL` with `sslmode=require`, `DB_SSL=true`, and `DB_SSL_REJECT_UNAUTHORIZED=false`.
- `backup.sql`, extracted `*.dir/` dump folders, logs, and `.env` files are local/private artifacts and must not be committed or shared insecurely.
- Hosted backend needs the same migrations/seeders run against its DB:

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run db:verify
```

- Do not run `db:reset` in production.
- When uploading zips to Hostinger, do not include `node_modules`, `.git`, logs, or local `.env`.
- Ensure backend deploy includes `backend/assets/letterhead.png`, `backend/assets/siyinqaba.png`, and `backend/assets/watermark.png`, or set `PDF_LETTERHEAD_PATH`, `LETTERHEAD_PATH`, `PDF_WATERMARK_PATH`, or `WATERMARK_PATH` as needed.
- If Hostinger builds the backend with `npm run build --prefix backend`, assets should be copied to `backend/dist/assets`.
- Email delivery currently uses `notificationsdatamatics@gmail.com` with a Gmail app password in environment variables. Gmail spam placement cannot be guaranteed from code; the long-term deliverability fix is a verified domain sender with SPF/DKIM/DMARC.

## Security Rules

- Never print, commit, or document real database passwords, SMTP app passwords, JWT secrets, refresh secrets, or encryption keys.
- Do not bypass onboarding for self-registered test takers.
- Test takers must complete onboarding before assessment access.
- Staff profiles must not allow self-changing assigned institution, `institutionId`, `currentInstitution`, `userType`, or test-taker journey fields through self-service profile endpoints.
- System Administrator and Test Administrator self-delete should remain hidden/blocked; self-delete is only for Test Takers.
- Keep profile/accessibility updates separated: Accessibility dialog/page is the source of truth for accessibility settings.
- Auth routes are excluded from the global API rate limiter in `rateLimiting.middleware.js`; avoid reintroducing IP blockers that break registration/OTP/password reset.
- Password rules are intentionally relaxed: minimum 6 characters, any characters allowed.
- OTP registration and forgot-password flows are current auth flows; do not revert to email verification links without asking.
- JWT access token TTL is intentionally short (`JWT_EXPIRE=15m`) with refresh-token rotation.
- `DATA_ENCRYPTION_KEY` protects encrypted national IDs; rotating it requires a planned migration.

## Coding Conventions

- Follow existing project style before inventing new patterns.
- Backend uses CommonJS (`require`, `module.exports`).
- Frontend uses React functional components and hooks.
- Use Joi validation in `backend/src/validations/` for backend request payloads.
- Keep route permissions explicit using role guards and/or `requirePermission`.
- Use services for business logic instead of putting complex logic directly into controllers.
- For manual edits, future Codex should use patch-based edits and avoid unrelated refactors.
- Use ASCII in docs/code unless existing file content or user-facing branding requires otherwise.
- Keep UI professional, compact, responsive, and consistent with government/ministry branding.

## What Not To Change Without Asking

- The OTP-based registration and password reset flow.
- Onboarding gating and completeness rules.
- Seeders for institutions, schools, tertiary institutions, priority list, Holland occupations, glossary terms.
- Assessment scoring logic and Holland Code tie handling.
- PDF/certificate letterhead and watermark requirements.
- Login card flow for counselor-imported learners.
- Role names: `System Administrator`, `Test Administrator`, `Test Taker`.
- User type labels: `High School Student`, `University Student`, `Professional`.
- Security-sensitive env names and encryption/key behavior.
- Production/shared database data.
- Any destructive migration, seed undo, `db:reset`, bulk user deletion, or cleanup script on a remote DB.

## Definition Of Done

For code changes:

- Read relevant files before editing.
- Keep changes scoped to the task.
- Preserve current user data and seeded reference data unless explicitly asked.
- Update or add focused tests where risk justifies it.
- Run appropriate checks:
  - Frontend UI change: `npm run build --prefix frontend`.
  - Backend JS change: `node --check <changed files>` and targeted Jest tests where applicable.
  - Seeder/database change: `npm run db:verify --prefix backend` where practical.
- Start or verify local system if user asked to test immediately.
- Report what changed, what was verified, and any remaining risk.

## Unconfirmed / Needs Verification

- Some older docs mention `npm run install-all`, `npm start` at repo root, Cypress E2E tests, and old email verification link routes. These are not verified in current `package.json` files. Prefer the verified commands in this file unless the repo is updated.
- Exact hosted Node.js startup command depends on Hostinger/Render configuration outside this repo.
- Email inbox placement for Gmail recipients depends on sender reputation and provider filtering, not only this codebase.
