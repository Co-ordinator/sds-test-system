# TROUBLESHOOTING.md

Troubleshooting notes for SDS Test System.

## Common Setup Problems

### Backend Cannot Connect To Database

Check:

- `backend/.env` exists.
- `DATABASE_URL` is correct, or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` are correct.
- For Render PostgreSQL external connections, SSL is required. Use `DATABASE_URL` with `sslmode=require`; for scripts that use `DB_HOST`/`DB_PORT`, set `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=false`.
- Database exists and accepts connections.

Useful commands:

```bash
npm run migrate --prefix backend
npm run db:verify --prefix backend
```

### Restoring A Render Backup Locally Or To Render

The 2026-06-27 Render backup downloaded as `2026-06-27T1327Z.dir` was a PostgreSQL directory-format dump. It was created by PostgreSQL 18.4, so PostgreSQL 16 `pg_restore` could not read it.

Use PostgreSQL 18 tools through Docker:

```bash
docker run --rm -i -v "${PWD}:/work" postgres:18 pg_restore --list /work/2026-06-27T1327Z.dir/2026-06-27T13_27Z/sds_test_db_s5ki
```

For the 2026-06-30 recovery, the dump was restored into a local Docker PostgreSQL 18 container, exported as `backup.sql`, restore-tested, and then restored into the new Render database `sds_labour`.

To restore `backup.sql` to a fresh Render database from a local machine:

```bash
docker run --rm -i -v "${PWD}:/work" postgres:18 psql "RENDER_EXTERNAL_DATABASE_URL_WITH_SSLMODE_REQUIRE" -f /work/backup.sql
```

Do not commit `backup.sql`, extracted `.dir` dump folders, or env files. They contain real database data and/or credentials.

### Migrations Or Seeders Fail

Do not run `db:reset` on shared/production DB.

Use:

```bash
npm run migrate --prefix backend
npm run seed --prefix backend
npm run db:verify --prefix backend
```

If seeders duplicate rows:

- Check seeders for upsert/dedupe behavior before editing data manually.
- Priority list and Holland occupation seeders were quality-sensitive; avoid adding duplicates.

### Frontend API Calls Go To Wrong URL

Local:

- `frontend/.env` can leave `REACT_APP_API_URL=` empty.
- CRA proxy in `frontend/package.json` points to `http://localhost:5000`.

Production:

- Set `REACT_APP_API_URL` if frontend and backend are not same-origin/proxied.
- Set backend `FRONTEND_URL` and `CORS_ORIGINS` if needed.

## Authentication Problems

### "Too many API requests from this IP..."

Current `backend/src/middleware/rateLimiting.middleware.js` skips `/api/v1/auth/*`, so registration/login/OTP/password reset should not be blocked by this limiter.

If non-auth users hit this in production:

- Check if many users share one proxy IP.
- Consider Express `trust proxy` configuration after verifying hosting behavior.
- Do not reintroduce strict auth endpoint IP blockers without approval.

### "Too many unsuccessful authentication attempts from this IP address..."

This was reported earlier and the limiter behavior was removed/relaxed for auth flows. If this message appears again:

- Search the codebase for that exact string.
- Check auth service lockout behavior separately from IP rate limiting.
- Confirm deployed code matches local code.

### "Invalid token"

Common after:

- JWT secret changed.
- Cookies from an older session remain in browser.
- Backend restarted with different env.

Fix:

- Logout if possible.
- Clear site cookies for local/hosted domain.
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are stable in environment.

### User Can Reach Dashboard Without Onboarding

This was a previous bug. Current expected behavior:

- Self-registered Test Takers must complete onboarding before assessment/dashboard flow.
- Imported learners may be marked complete only when required imported fields exist.

Check:

- `frontend/src/components/auth/ProtectedRoute`
- `backend/src/middleware/authentication.middleware.js`
- auth/profile/onboarding recomputation logic in auth service/controller.
- Run:

```bash
npm run audit:onboarding --prefix backend
```

### User Has Blank Institution Or Region

Known cause:

- Imported learner record did not copy institution/region from matched school.
- User bypassed/incompletely completed onboarding.

Check:

- `users.institution_id`
- `users.region`
- `users.user_type`
- import CSV institution matching.
- profile/onboarding required fields.

## Registration And OTP Email Problems

### OTP Email Goes To Spam

Code changes already made:

- Sender aligned to `notificationsdatamatics@gmail.com`.
- Templates simplified to transactional official notices.
- OTP emails avoid unnecessary verification links/buttons/card-heavy layout.

Still, Gmail spam placement is controlled by Gmail reputation/filtering. Application code cannot guarantee Primary inbox.

Long-term fix:

- Use a verified domain sender, e.g. a Datamatics/ministry domain email.
- Configure SPF, DKIM, DMARC.
- Warm sender reputation.

Check production env:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notificationsdatamatics@gmail.com
SMTP_FROM_EMAIL=notificationsdatamatics@gmail.com
SMTP_FROM_NAME=Self-Directed Search System
SMTP_REPLY_TO=notificationsdatamatics@gmail.com
FRONTEND_URL=https://brown-cobra-764328.hostingersite.com
```

Never document or print `SMTP_PASS`.

### "Account created, but verification code email could not be sent..."

Check:

- `SMTP_PASS` is a Gmail app password, not normal Gmail password.
- SMTP env vars are set on hosted backend.
- Network/DNS to `smtp.gmail.com` works from host.
- Backend logs for `EMAIL_FAILED`.

### OTP Email Still Shows Old Template

Likely cause:

- Backend process still running old compiled template.

Fix:

- Restart backend.
- Confirm deployed `backend/src/templates/emails/verify-email.hbs` and `reset-password-otp.hbs`.

## Password Problems

### Registration Says Password Needs 12 Characters Or Letters/Numbers

Current expected rule:

- At least 6 characters.
- Any characters allowed.

Check all places:

- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/ForgotPassword.jsx`
- `frontend/src/pages/ResetPassword.jsx`
- `frontend/src/pages/ChangePassword.jsx`
- `frontend/src/pages/Profile.jsx`
- `backend/src/validations/auth.validation.js`

Search:

```bash
rg -n "12 characters|8 characters|letters and numbers|Use letters|minLength.*8|passwordPattern" frontend/src backend/src
```

## Test Administrator / Import Problems

### Student Import Says Institution Is Required

Meaning:

- Test Administrator is not assigned to an institution, or import did not supply a usable `institutionId`.

Fix:

- Assign Test Administrator to an institution.
- Or supply `institutionId` where import endpoint supports it.
- Ensure institution exists in seeded `institutions`.

### Institution Name In CSV Does Not Exactly Match

The import flow should support tolerant matching/suggestions. If it fails:

- Check `backend/src/services/studentImport.service.js`.
- Ensure seeded institution name exists.
- Avoid ambiguous partial names if multiple institutions match.

### Login Cards Generated Without Passwords

This was fixed earlier. Expected login card includes:

- learner name
- login number/student code
- temporary password
- instructions

Check:

- `backend/src/controllers/counselor.controller.js`
- `frontend/src/features/counselor/CounselorLoginCardsPanel.jsx`
- `backend/src/services/studentImport.service.js`

### Login Card Password Is Rejected

Older builds generated a new temporary password every time a login-card PDF was
downloaded. That silently invalidated any earlier downloaded or printed card.

Current expected behavior:

- Run `npm run migrate --prefix backend` before starting the updated backend.
- The first card generation issues a temporary credential and clears failed
  login attempts or an active account lockout.
- Reprinting while `mustChangePassword` is still true reuses the same temporary
  credential, so the earlier card remains valid.
- After the learner chooses a new password, generating another card issues a
  new temporary credential and invalidates the learner-chosen password.
- Test Administrators do not select another institution; their cards are
  always restricted to the institution assigned by a System Administrator.

Cards created before this migration cannot be reconstructed safely. Generate
one new PDF after deployment and use that version.

## Assessment Problems

### Skipped Question Popup Blocks Mobile Answering

Expected behavior:

- Popup/panel only appears after Submit is clicked and skipped questions exist.
- No cancel button.
- It disappears once all skipped questions are answered.
- On mobile it should sit at top/allow answering below.

Check:

- `frontend/src/pages/Questionnaire.jsx`

### Submit Button Does Not Appear After Answering Skipped Questions

Expected:

- When all skipped questions are answered, Submit replaces Next/continues normal submit.

Check state derivation in questionnaire page.

## Results/PDF/Certificate Problems

### PDF Or Certificate Images Missing On Hostinger

Cause:

- Backend cannot read frontend-only public assets after deployment.

Fix:

- Ensure these exist with backend:
  - `backend/assets/letterhead.png`
  - `backend/assets/siyinqaba.png`
  - `backend/assets/watermark.png`
- Or set env paths:
  - `PDF_LETTERHEAD_PATH`
  - `LETTERHEAD_PATH`
  - `PDF_WATERMARK_PATH`
  - `WATERMARK_PATH`
- Run backend build:

```bash
npm run build --prefix backend
```

### Results PDF Looks Old/Card-Based

Current renderer should be `backend/src/utils/resultsPdfRenderer.js`, clean document style.

If hosted PDF is old:

- Confirm deployed file is current.
- Restart backend.
- Clear any cached downloaded PDF locally.

### PDF Generation Fails

Check:

- Backend logs for `PDF_GENERATION_FAILED`.
- `backend/src/utils/resultsPdfRenderer.js` syntax:

```bash
node --check backend/src/utils/resultsPdfRenderer.js
```

- Assessment must be completed.
- User must be owner or staff with authorization.

### Certificate Signature Line Should Not Appear

This was requested/fixed previously. If it reappears:

- Check `backend/src/controllers/certificate.controller.js`.

### Professional Certificate Shows A School Or Missing Details

Expected behavior:

- High School Student uses school/institution and region.
- University Student uses tertiary institution and region.
- Professional uses occupation, workplace, district, and region.
- Missing legacy fields are omitted; `NOT SPECIFIED` should never be printed.

Check:

- `users.user_type`, `workplace_name`, `current_occupation`, `district`, and `region`.
- `assessments.certificate_profile_snapshot` for assessments completed after the role-aware certificate migration.
- `backend/src/utils/certificateRecipient.js` and `backend/src/services/certificate.service.js`.

Before deploying the updated backend, run the non-destructive migration:

```bash
npm run migrate --prefix backend
```

Do not backfill historical snapshots automatically. Older assessments fall back to current profile data because their original professional context cannot be reconstructed reliably.

### Button Says "Generate and Download Certificate"

Expected wording requested:

- "Download Certificate"

Check:

- `frontend/src/pages/TestResults.jsx`
- `frontend/src/pages/TestTakerDashboard.jsx`

## Admin Dashboard Problems

### Institution KPI Count Wrong

Expected:

- Account for schools, universities, colleges, TVET, and other institution types.
- Filtering by institution type should affect KPIs and graphs.

Check:

- analytics/admin services and controllers.
- institution type normalization.
- frontend dashboard filter payload.

### Graphs Show Dummy/Fake Data

Requirement:

- Admin graphs must use real DB data only.

Fix:

- Remove hard-coded insights.
- Show empty states when data is not available.

## Accessibility Problems

### Screen Reader Mode Does Not Narrate Navigation

Expected:

- When account has screen reader mode on, route changes announce with same voice behavior as glossary.

Check:

- `frontend/src/context/AccessibilityContext.js`
- `AccessibilityRouteAnnouncer` in `frontend/src/App.js`

### Accessibility Setting Carries To Another Account

Expected:

- Accessibility settings are per account.

Check:

- Auth logout/login clears or reloads accessibility state.
- Accessibility context reads current user settings.

## Deployment Problems

### Uploaded Zip Missing Files

Do not include:

- `node_modules`
- `.git`
- logs
- local `.env`
- zip archives

Do include:

- source code
- migrations/seeders
- docs/reference docs if collaborators need source context
- backend PDF assets

### Hosted Build Does Not Have `src/pages`

If browsing built files on Hostinger:

- Production React build bundles source into static JS files.
- `src/pages` will not appear in build output.
- It exists only in source repository.

### Blank Screen Before App Loads

A branded startup/loading screen was added to avoid blank load delay. If blank screen returns:

- Check `frontend/public/index.html` and startup CSS/loader.
- Check JS bundle errors in browser console.

## Documentation Problems

Some older docs may still contain:

- old token-link verification routes
- stale commands (`npm run install-all`, root `npm start`)
- old test credentials
- older public API domain examples

Future agents should prefer package files and current code over older docs, then update docs when discrepancies are confirmed.

## Unconfirmed / Needs Verification

- Current Hostinger runtime/deploy settings.
- Current production database seed status.
- Current Gmail deliverability after the latest template simplification.
- Whether all old screenshots/design variants are still relevant.
