# SDS QA Remediation Report

## Environment and repository summary

- Applications/packages: npm-workspace monorepo with `frontend` and `backend`, orchestrated by Turborepo.
- Front-end stack: React 19, React Router 7, Create React App, Tailwind CSS, Recharts, Leaflet, Axios, React Hook Form.
- Back-end stack: Node.js CommonJS, Express 5, Sequelize 6, Joi, JWT/httpOnly cookies, Nodemailer, PDFKit.
- Database/migrations: PostgreSQL with `sequelize-cli`; the configured development connection is the restored shared Render database.
- Authentication/session model: short-lived JWT access cookie plus rotating seven-day refresh cookie; OTP email verification and OTP password reset.
- Test commands: `npm test --prefix backend -- --runInBand`, `npm test --prefix frontend -- --watchAll=false --runInBand`, workspace builds, error-contract tests, no-console check, seed-integrity verification, and targeted read-only analytics/database queries.
- Contributor integration: commit `5a97761` was reviewed but not cherry-picked because it contained stale UI assumptions. Its valuable OTP, result-email, FAQ, analytics, accessibility, certificate, notification, and admin fixes were retained or reimplemented against the current UI.

## Baseline results

- Build: the initial front-end production build passed. The initial back-end build passed.
- Type-check: no independent TypeScript/type-check command exists; the repository is JavaScript.
- Lint: no front-end lint script exists. The back-end `check:no-console` check passes.
- Unit/integration/E2E tests: the first complete back-end run had 23 passing suites and two failures: the destructive admin DB E2E suite tried to fall back to the shared DB without test SSL, and a counselor unit mock lacked the transaction API now used by login-card generation.
- Pre-existing/worktree state: the repository was already heavily modified and uncommitted. User-owned changes and the current landing page were preserved. The stale contributor commit was not merged wholesale.
- Test safety correction: database E2E tests now require `RUN_DB_E2E=true` and a `TEST_DATABASE_URL` different from `DATABASE_URL`, preventing `sequelize.sync({ force: true })` from touching the shared database.

## Issue status

`Partial` below means the code fix and automated/static checks are complete, but a required visual, full browser-flow, live SMTP, or email-client check was not run. Browser verification was stopped at the user's request.

| ID | Status | Root cause | Fix implemented | Main files | Tests/evidence | Assumptions or blocker |
|---|---|---|---|---|---|---|
| TT-01 | Partial | Dashboard settings icon had no action. | Added an accessible recommendation-options dialog with results/profile actions, Escape, click-away, and focus restoration. | `TestTakerDashboard.jsx` | Front-end build; code inspection. | Mouse/touch visual run not performed. |
| TT-02 | Complete | Help used a public route regardless of session. | Added history-first, role-aware dashboard fallbacks. | `Help.jsx`, `helpNavigation.js` | `helpNavigation.test.js` covers public and all authenticated roles. | None. |
| TT-03 | Complete | Qualification upload remained in profile and API flow. | Removed upload UI, route, controller, and service while retaining existing records/model for readability and deletion cleanup. | `Profile.jsx`, `app.js`; deleted qualification route/controller/service | Front-end/back-end builds; active-route search. | Existing rows intentionally retained. |
| TT-04 | Complete | Grade and education UUID were validated independently. | Added shared rank mapping and matching-pair rejection on client and server. | `profileOptions.js`, `profileEducation.js`, `auth.service.js` | `profileOptions.test.js`, `profileEducation.test.js`, `auth.profile.service.test.js`. | None. |
| TT-05 | Complete | UI used legacy Matric-era wording. | Added canonical options and safe legacy aliases; standardized reference descriptions through migration. | `profileOptions.js`, `profileEducation.js`, `20260723000000-*` | Unit tests plus live DB description query. | UUID remains the stable stored education identifier. |
| TT-06 | Complete | Registration and reset OTP lifetimes/invalidation differed. | Defaulted both to five minutes, hashes OTPs, rejects expired/reused values, and invalidates the previous OTP on resend. | `auth.service.js`, `.env.example` | `auth.otp.service.test.js` covers valid, expired, reused, and resent codes. | Environment overrides should remain equal. |
| TT-07 | Partial | Search controls treated fetching as a disabled state. | Kept district and institution inputs enabled during fetch and preserved controlled selections. | `DistrictSearchInput.jsx`, `InstitutionSearchInput.jsx`, `Profile.jsx` | Front-end build; code inspection. | Keyboard/touch browser run not performed. |
| TT-08 | Complete | Profile form and API accepted incomplete required fields. | Added role-aware client errors/focus and server-side effective-profile validation before persistence. | `Profile.jsx`, `auth.service.js` | `auth.profile.service.test.js` proves rejection without `user.update`. | Legacy incomplete imported profiles remain readable. |
| TT-09 | Complete | Validation failure was conflated with onboarding state. | Invalid saves remain on Profile with preserved data and an error; no onboarding redirect. | `Profile.jsx`, `AuthContext.js` | Front-end build; API validation test. | None. |
| TT-10 | Partial | Password visibility handling remounted/cleared input state. | Toggles now only change input type and expose `aria-label`/`aria-pressed`. | `ChangePassword.jsx`, `Profile.jsx` | Front-end build; code inspection. | Caret/focus browser run not performed. |
| TT-11 | Partial | High-contrast tooltip inherited unreadable normal colors. | Added explicit accessible high-contrast foreground/background/focus styles. | `index.css` | Front-end build; style inspection. | Contrast was not measured in a live browser. |
| TT-12 | Complete | Help ignored history and role. | Uses browser history when available and a role-safe fallback otherwise. | `Help.jsx`, `helpNavigation.js` | `helpNavigation.test.js`. | None. |
| TT-13 | Partial | Glossary input value/color was not reliably visible. | Bound the controlled value and corrected theme/high-contrast input styling. | `GlossaryPage.jsx`, `index.css` | Front-end build; code inspection. | Component browser run not performed. |
| TT-14 | Partial | Speech state disabled unrelated controls and could overlap. | Speech is asynchronous, cancelable, single-instance, and cleaned up on unmount/navigation. | `GlossaryPage.jsx` | Front-end build; code inspection. | Speech synthesis browser run not performed. |
| TT-15 | Complete | Dashboard relied on a stale/minimal session object. | Dashboard fetches `/auth/me` and renders current contact/profile data with graceful fallbacks. | `TestTakerDashboard.jsx` | Front-end build; API health and source trace. | None. |
| TT-16 | Partial | UI lacked a complete owned-assessment-to-SMTP path. | Added authenticated result-email route, template context, provider-result awaiting, accurate UI errors, and safe logs. | `test-results.routes.js`, `test-results.hbs`, `TestResults.jsx`, `email.config.js` | `test-results.email.route.test.js`, `resultsEmail.template.test.js`. | Live SMTP delivery was not sent. |
| TT-17 | Complete | Gender existed in schema but was missing from profile edit/display flow. | Added four approved options to onboarding/profile payloads and validation. | `profileOptions.js`, `Onboarding.jsx`, `Profile.jsx` | `profileOptions.test.js`; live segmentation query. | No schema migration was needed because the nullable enum already existed. |
| TT-18 | Partial | Duplicate unverified records could block a restarted registration. | Reuses one matching unverified record, resets OTP state, rejects ambiguous identity merges, and routes unverified login back to OTP. | `auth.service.js`, `Register.jsx`, `Login.jsx`, `VerifyOtp.jsx` | `auth.otp.service.test.js` covers resume, conflict, and login recovery. | Full refresh/logout browser E2E was not run. |
| TT-19 | Complete | Reset OTP/token branches produced inconsistent exceptions and token state. | Added uniform unknown/invalid/expired/reused handling, constant-time hash comparison, single use, role-independent reset, and refresh-family rotation. | `auth.service.js`, `auth.controller.js`, reset pages/templates | `auth.otp.service.test.js` covers all roles and failure classes. | Live email dispatch is environment-dependent, but generation/validation is deterministic. |
| TT-20 | Complete | FAQ had no approved configurable media source. | Added lazy YouTube privacy embed/direct video support and hides the section when unset. | `Help.jsx`, `frontend/.env.example` | Front-end build; empty configuration is active locally. | Production must provide an approved URL if desired. |
| TT-21 | Complete | Official title was duplicated/incomplete. | Added a shared back-end brand constant and full title in desktop/mobile navigation and certificates. | `brand.js`, `government.js`, `AppShell.jsx`, certificate files | Front-end/back-end builds; certificate PDF tests pass. | None. |
| SA-01 | Partial | Leaflet default z-index exceeded navigation overlays. | Lowered map stacking contexts and raised navigation/drawer layers. | `EswatiniLeafletMap.jsx`, `AppShell.jsx` | Front-end build; style inspection. | Desktop/mobile visual run not performed. |
| SA-02 | Complete | Engagement numerator used completed attempts instead of unique attempted users. | Numerator is `COUNT(DISTINCT assessments.user_id)` with no status restriction; denominator remains the existing filtered user total. | `analytics.service.js`, `AdminDashboardOverviewTab.jsx` | `analytics.overview.service.test.js`; live query: 74 unique engaged users from 80 attempts. | Formula: unique users with any started/completed attempt ÷ filtered users. |
| SA-03 | Complete | SQL returned only days containing attempts. | Generates an exact UTC calendar range and zero-fills every day, including leap-year handling. | `dailyDateSeries.js`, `analytics.service.js` | `dailyDateSeries.test.js`; live daily-range query. | None. |
| SA-04 | Complete | Compact Holland code discarded tied display ranks. | Stores/derives deterministic slash-separated display codes and propagates them through analytics/results. | `scoring.service.js`, assessment/result files | `scoring.service.test.js` covers two-way, multi-way, and no tie. | None. |
| SA-05 | Partial | Average score-share card had a broken/missing data path. | Restored RIASEC average mapping and chart empty/loading behavior. | `AnalyticsOverviewSection.jsx`, `AnalyticsTrendsSection.jsx`, `Analytics.jsx` | Front-end build; live analytics query returns averages. | Visual chart run not performed. |
| SA-06 | Complete | Static kebab controls advertised unsupported actions. | Removed misleading National Insight option controls. | analytics section components | Front-end build; source search finds no remaining card kebab control. | No unsupported actions were invented. |
| SA-07 | Complete | User types were deduplicated by inconsistent labels. | Centralized stable values and merges only display aliases in derived data. | `analyticsConstants.js`, `Analytics.jsx` | Front-end tests/build; live distribution returns one row per canonical type. | None. |
| SA-08 | Complete | User-type query ignored assessment dates. | Date-bound assessment join now filters user-type distribution using the same UTC boundaries. | `analytics.service.js`, `Analytics.jsx` | Live baseline vs 2000 date-range query returned different expected distributions. | None. |
| SA-09 | Complete | ECOT master record was Manzini and map used a separate request. | Reversible master-data correction sets Hhohho/Mbabane; map and table share `regionalData`. | `20260723000200-*`, seeders, `Analytics.jsx` | Live DB query confirms ECOT; seed integrity passes. | Hhohho/Mbabane follows repository-authoritative seed correction. |
| SA-10 | Complete | School rows were misclassified as tertiary/other. | Reclassified 24 high/secondary/central schools and applies canonical server-side institution type filters. | `20260723000200-*`, `analytics.service.js` | Live query: university results only `university`, school results only `school`. | None. |
| SA-11 | Complete | Duplicate normalized names created duplicate/broken IDs. | Re-pointing migration removed 12 duplicates, retained rollback JSON, and added normalized unique index; UI dedupes by ID. | `20260723000100-*`, `Analytics.jsx` | Live query: zero duplicate groups; backup has 12 rows; unique index exists. | Removed rows had zero dependent references; migration also handles references generically. |
| SA-12 | Partial | Shared table aligned body cells but not matching headers. | Header and cell alignment now use the same column alignment contract. | `DataTable.jsx` | Front-end build; source inspection. | Narrow-layout visual run not performed. |
| SA-13 | Complete | Static section option buttons had no supported action. | Removed dead controls from Career Overview, Regional Map, and Trends/Segmentation. | analytics section components | Front-end build; source search. | No unsupported actions were invented. |
| SA-14 | Partial | Funding labels had insufficient responsive margins/wrapping. | Added responsive chart layout, margins, truncation, tooltip, and accessible full labels. | `AnalyticsFundingAlignmentSection.jsx` | Front-end build; source inspection. | Representative widths were not browser-rendered. |
| SA-15 | Partial | Vertical SLAS labels intruded into bars. | Changed layout/margins so category labels remain outside bar marks without page scrolling. | `AnalyticsFundingAlignmentSection.jsx` | Front-end build; source inspection. | Tablet/mobile visual run not performed. |
| SA-16 | Complete | Badge value was static/stale. | Uses efficient unread count API, monotonic request sequencing, and notification change events. | `useNotificationCount.js`, notification service/controller | `admin.notifications.service.test.js`. | None. |
| SA-17 | Partial | Result email used web layout/min-width assumptions. | Rebuilt with fluid tables, inline critical CSS, conservative media query, and plain-text fallback. | `test-results.hbs`, `email.config.js` | `resultsEmail.template.test.js` verifies no width forcing. | External email-client previews were not available. |
| SA-18 | Partial | FAQs were hardcoded and lacked CRUD/storage. | Added FAQ model/migration, normalized service, authorized routes, admin CRUD/publish/order UI, and published Help loading. | FAQ model/service/routes/panel, `Help.jsx` | `faq.service.test.js`, `faq.routes.authorization.test.js`, builds. | UI CRUD browser run not performed. |
| SA-19 | Complete | Mark-all did not update state/count immediately. | Scoped update is idempotent, returns affected count, refreshes list, and emits badge update event. | `admin.service.js`, `Notifications.jsx`, `useNotificationCount.js` | `admin.notifications.service.test.js`. | None. |
| SA-20 | Complete | Segmentation omitted completion dimensions and unknown buckets. | Added age buckets, gender, region, status, completion-by-gender, and completion-by-region aggregates with shared filters. | `analytics.service.js`, `AnalyticsTrendsSection.jsx` | Live query returned age/gender/region/status groups; back-end suite passes. | Aggregates only; no row-level PII is returned. |
| SA-21 | Complete | Grade remained in two report definitions/exports. | Removed Grade field/filter/projection from both specified reports. | `AdminReportsPanel.jsx`, report/admin services | Front-end/back-end builds; source search. | None. |
| SA-22 | Complete | UI fell back to `institutionId`. | Admin list/detail APIs eagerly join Institution and render its canonical name with a missing-relation fallback. | `admin.service.js`, `AdminUserDetailPage.jsx`, `AdminUsersPanel.jsx` | Back-end/front-end builds; include/join inspection. | None. |
| SA-23 | Partial | Initial `/auth/me` explicitly skipped refresh and concurrent 401s could race. | Initial hydration now permits cookie refresh; interceptor single-flights refreshes and only expires the session on true refresh auth failure. | `AuthContext.js`, `api.js` | `api.authRefresh.test.js` covers concurrent 401, true expiry, and transient 503. | Full deep-link browser E2E was not run. |
| SA-24 | Partial | Mobile menu was document-positioned without focus/scroll management. | Uses fixed viewport overlay, backdrop, body lock, Escape, Tab trap, ARIA, and focus restoration. | `AppShell.jsx` | Front-end build; source inspection. | Mobile visual/focus run not performed. |
| SA-25 | Complete | Empty strings and stale responses could overwrite the restored baseline with zeros. | Removes empty params, shows loading, resets to `{}`, and ignores superseded requests. | `Analytics.jsx`, `analyticsFilters.js` | `analyticsFilters.test.js`; live unfiltered/date-filter queries. | None. |
| SA-26 | Complete | Counts were calculated from a different already-search-filtered array. | One utility applies search/type/region/status to both rows and summary; displays filtered/total/pending semantics. | `AdminInstitutionsPanel.jsx`, `institutionFilters.js` | `institutionFilters.test.js` covers region, classification, search, status, and reset. | All institutions are loaded before client pagination, so counts cover the full dataset. |

## Database and configuration changes

- Migrations:
  - `20260723000000-standardize-education-levels.js`: updates five descriptions and backfills recognized Test Taker grades with a rollback table.
  - `20260723000100-deduplicate-institutions.js`: merges duplicate normalized names, re-points dependencies, saves complete rollback JSON, and adds `institutions_normalized_name_unique`.
  - `20260723000200-correct-institution-master-data.js`: reclassifies school names and corrects ECOT, with a rollback table.
- Applied/verified database results:
  - All migrations report `up`.
  - Duplicate groups: `0`; duplicate rollback rows: `12`.
  - Misclassified matching schools: `0`.
  - ECOT: `tvet`, `hhohho`, `Mbabane`.
  - Recognized grade rows missing education UUID: `0`.
  - `npm run db:verify --prefix backend`: passed.
- Seed/reference-data changes: education descriptions and ECOT seed location were aligned with the migrations.
- New environment variables:
  - Back end: `EMAIL_OTP_TTL_MS`, `PASSWORD_RESET_OTP_TTL_MS`, both resend cooldowns, and safe-test gate `RUN_DB_E2E`.
  - Front end: optional `REACT_APP_FAQ_VIDEO_URL`.
- Deployment steps for later hosting: install dependencies, run `npm run migrate --prefix backend`, run `npm run db:verify --prefix backend`, configure SMTP/OTP/video variables, build both workspaces, and deploy. Do not run `db:reset`.

## Commands run and final results

- `node --check` across 200 back-end JavaScript files: passed.
- `git diff --check`: passed.
- `npm test --prefix backend -- --runInBand`: 29 suites passed, 92 tests passed; 10 destructive DB E2E tests safely skipped because no isolated test DB was configured.
- `npm test --prefix frontend -- --watchAll=false --runInBand`: 8 suites, 26 tests passed.
- `npm run test:error-contract --prefix backend`: 2 suites, 6 tests passed.
- `npm run check:no-console --prefix backend`: passed.
- `npm run build --prefix frontend`: passed.
- `npm run build --prefix backend`: passed.
- `npm run migrate --prefix backend`: all migrations applied.
- `npm run db:verify --prefix backend`: passed.
- Read-only live analytics smoke query: overview, daily trend, regional, date-filtered user types, institution-type filters, and segmentation all returned successfully.
- Local API: `http://localhost:5000/health` returned HTTP 200 and success.
- Local front end: `http://localhost:3000` returned HTTP 200.
- Browser-based UI verification was stopped at the user's request; affected items are marked Partial rather than overstated.
