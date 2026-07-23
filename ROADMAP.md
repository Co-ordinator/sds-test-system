# ROADMAP.md

Roadmap and working backlog for SDS Test System.

## Completed / Substantially Completed

### Authentication And Account Flow

- OTP registration verification.
- OTP forgot-password/reset flow.
- Professional email templates for OTP/reset/imported credentials.
- SMTP alignment to `notificationsdatamatics@gmail.com`.
- Password policy relaxed to minimum 6 characters and any characters allowed.
- Removed/relaxed auth blockers that prevented registration/reset.
- Onboarding bypass fixed.
- Required onboarding fields strengthened.

### Test Taker UX

- Test taker dashboard redesigned toward contributor-provided style.
- Dashboard banner/side navigation/header behavior updated.
- Welcome hand icon animation added on page reload.
- Skipped-question submit panel implemented and reworked.
- Mobile behavior improved for skipped-question panel.
- Accessibility settings completed end-to-end and made per-account.
- Screen reader route announcements integrated with glossary voice behavior.

### Landing/Auth UI

- Landing page underwent multiple redesigns and currently should be preserved unless explicitly changed.
- Login/register/reset/forgot password pages redesigned.
- Startup loading screen added with logo and rotating circle.
- Help/About pages and footer behavior adjusted.
- Learn More routes to Help.
- Datamatics link should route to `datamatics.co.sz`.

### Data And Seeding

- High schools seeded from four regional Word docs.
- Tertiary institutions seeded from docs.
- Institution type/category handling improved for KPIs/filtering.
- Priority list seeded from docs/excel for funding alignment.
- Holland occupational code data extracted/seeded.
- Occupation-course linking seeded.
- Datamatics and extra glossary terms seeded.
- Extra glossary terms added for assessment comprehension.
- 2026-06-30 Render database recovery completed: downloaded directory-format backup was restored through Docker/PostgreSQL 18, exported as local `backup.sql`, restore-tested, and restored into the new Render PostgreSQL database `sds_labour`.

### Admin/Test Administrator

- Analytics merged into admin dashboard.
- Admin KPI/filter work done for institutions/institution types.
- Test Administrator student import improved with institution matching.
- Login cards fixed to include temporary password.
- Imported learners now carry region/institution data.
- Counselor/test administrator role clarified as school career guidance teacher/counselor.

### Reports/PDF/Certificates

- Certificate watermark asset handling updated.
- Certificate wording made role-aware for high-school, university, and professional test takers.
- Non-sensitive certificate profile context is snapshotted transactionally at assessment completion.
- Database-free certificate PDF regression coverage added for current, legacy, and snapshot-backed profiles.
- Result PDF remade as clean official document style.
- Tied Holland Code interpretation corrected.
- Career option display made more human-friendly.
- PDF/certificate asset deployment issue addressed with backend assets/build-copy logic.

## Currently In Progress / Recent Changes Not Yet Stabilized

- Email deliverability: code simplified templates and aligned sender, but Gmail spam placement still needs real-world retesting.
- Results PDF: renderer was recently replaced; visual QA with actual downloaded PDF should be done after deploy.
- Working tree had uncommitted changes as of this file creation. Future agents should check `git status`.
- Hostinger env handoff is pending: local `hostinger env.txt` was updated with the new Render database settings and should be pasted into Hostinger, then the backend should be restarted/redeployed.

## Remaining Work

### High Priority

1. Verify hosted registration OTP delivery after latest email-template simplification.
2. Verify hosted result PDF and certificate images after uploading/building on Hostinger.
3. Paste the updated Hostinger env values, restart/redeploy the backend, and verify the hosted app connects to the restored Render database.
4. Review and update older docs that still reference old email verification link routes or unverified commands.
5. Test onboarding for all three test taker types end-to-end:
   - High School Student
   - University Student
   - Professional
6. Test imported learner workflow end-to-end:
   - CSV import
   - login card generation
   - login with temporary password
   - password change
   - dashboard/profile/report/certificate data

### Medium Priority

1. Add or update tests for OTP registration and forgot password flows.
2. Add tests for onboarding gating and required field recomputation.
3. Add tests for institution search/matching behavior.
4. Add tests for admin dashboard filter behavior.
5. Add tests or snapshot-level checks for PDF generation.
6. Improve API docs to match OTP endpoints and current auth behavior.
7. Review role-specific Profile page behavior after recent fixes.
8. Continue glossary filtering and tooltip accuracy improvements.
9. Verify all dashboard charts are real-data only and filter-aware.

### Lower Priority / Future Features

1. siSwati/multilingual support:
   - Translation provider was discussed but deferred.
   - Glosbe and other free APIs were considered but not adopted.
2. Domain-based email sender:
   - Replace Gmail with a verified domain sender if possible.
   - Configure SPF, DKIM, DMARC.
3. More robust asset deployment:
   - Ensure backend build/deploy never loses PDF/certificate assets.
4. Production observability:
   - Centralized logs, error tracking, uptime/health checks.
5. Better admin reporting exports.
6. More granular test administrator institution scoping if needed for all 300+ schools.

## Known Open Bugs / Risks

- Gmail may still put OTP emails in spam due to sender reputation.
- The new Render PostgreSQL database is still a free instance unless upgraded; free Render databases expire/deletion windows should be monitored or moved to a paid instance.
- Older docs may be stale in places.
- Some local logs show invalid-token requests when browser cookies are stale; users may need logout/clear cookies after secret changes.
- `trust proxy` is not currently set in Express. Behind some hosts/proxies, non-auth IP rate limiting may group users under one IP.
- Landing page and auth pages have had many design iterations; avoid unsolicited redesigns.
- Large reference documents in repo may need review for repository size and licensing/copyright.

## Technical Debt

- `assessment.controller.js` still contains unreachable old PDF-rendering code after the early `return` in `downloadResultsPdf`. It is harmless but should be cleaned carefully in a separate refactor.
- Some docs include older test credentials and route descriptions; verify before using.
- API docs still mention `GET /verify-email/:token` style flows in places, while current UI uses OTP.
- Some README commands appear stale (`npm run install-all`, root `npm start`, Cypress E2E mention).
- Need consistent spelling/branding: code/docs use both Labour and Labor. UI requirement is generally "Ministry of Labour: Measurement and Testing Unit".
- Need comprehensive frontend tests for critical flows.
- Need documented production deployment process for Hostinger specifically.

## Suggested Next Tasks In Priority Order

1. Commit the current working changes with a clear human commit message after reviewing `git diff`.
2. Deploy to staging/Hostinger and test:
   - registration OTP
   - onboarding
   - login
   - assessment submit with skipped question handling
   - results PDF
   - certificate download
3. Update `docs/API_DOCUMENTATION.md` to current OTP endpoints.
4. Update `README.md` commands to match actual package scripts.
5. Add regression tests for auth/onboarding/PDF smoke.
6. Verify admin institution filters and KPI counts on seeded production DB.
7. Revisit email deliverability with domain authentication.

## Unconfirmed / Needs Verification

- Whether Hostinger build command runs backend `npm run build` or starts from source.
- Whether all collaborators have the same reference docs and local env setup.
- Whether the Hostinger backend has been restarted with the updated `hostinger env.txt` values after the 2026-06-30 Render database restore.
