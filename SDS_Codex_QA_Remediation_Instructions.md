# SDS System QA Remediation Task for Codex (GPT-5.6 Sol)

> **Primary instruction:** Inspect the existing SDS repository, implement the fixes below, add or update tests, run all relevant verification commands, and produce a truthful completion report. Do not stop after analysis or merely describe proposed fixes.

## 1. Mission

Resolve every listed Test Taker and System Admin issue in the existing SDS system. Preserve the current architecture, visual identity, role model, and established API conventions unless a listed requirement explicitly requires a change.

The source QA report contains **47 tracked items**: **21 Test Taker issues** and **26 System Admin issues**.

## 2. Non-negotiable rules

- Read every repository-level and directory-level `AGENTS.md`, `README`, contribution guide, environment template, migration convention, and test instruction before editing code.
- First identify the actual front-end, back-end, database, authentication, email, charting, and test stacks. Do not assume framework names.
- Implement fixes in the existing system. Do not create a replacement application, parallel prototype, or unnecessary rewrite.
- Fix root causes rather than hiding symptoms with redirects, arbitrary delays, broad `try/catch`, forced reloads, hardcoded counts, or disabled validation.
- Do not hardcode credentials, production URLs, institution mappings, user IDs, access tokens, OTPs, analytics totals, or email recipients.
- Do not modify production data directly. Use safe, reversible migrations/seed corrections following repository conventions.
- Preserve backward compatibility where practical. When a contract must change, update all callers, validation, types, tests, and documentation together.
- Authentication and password-reset fixes must not weaken security, leak account existence, expose tokens, or bypass role authorization.
- For every UI issue, verify keyboard access, focus behavior, responsive layout, loading/error/empty states, and browser-console cleanliness.
- For every analytics issue, make filters, date boundaries, time zones, deduplication, and aggregation semantics consistent across API and UI.
- Do not claim an external integration is verified when required credentials or services are unavailable. Implement deterministic tests/mocks and report the remaining environment verification honestly.
- Do not mark an item complete until its acceptance criteria have been implemented and verified.

## 3. Required execution workflow

1. **Repository reconnaissance:** map applications/packages, routes, modules, data models, migrations, API endpoints, state stores, shared UI components, mail templates, analytics queries, and existing tests relevant to these issues.
1. **Baseline:** install dependencies using the repository's lockfiles; run the existing build, type-check, lint, unit tests, integration tests, and end-to-end tests before edits. Record pre-existing failures separately.
1. **Plan:** create a dependency-aware implementation plan. Handle shared root causes together, but retain traceability to every QA ID.
1. **Implementation order:** Critical → High → Medium → Low. Within a severity, fix foundational data/auth/API defects before dependent UI behavior.
1. **Tests:** add the smallest reliable regression test at the correct layer for each fix. Prefer unit tests for pure logic, API/integration tests for data/auth, and component/E2E tests for user flows.
1. **Verification:** rerun all relevant checks after each logical batch and the complete suite at the end.
1. **Final report:** create `QA_REMEDIATION_REPORT.md` in the repository root using the reporting format in Section 7.

## 4. Priority queue

- **Critical:** TT-18, TT-19, SA-02
- **High:** TT-01, TT-02, TT-06, TT-07, TT-08, TT-09, TT-12, TT-14, TT-15, TT-16, SA-04, SA-08, SA-09, SA-10, SA-11, SA-17, SA-18, SA-20, SA-22, SA-23, SA-24, SA-25, SA-26
- **Medium:** TT-03, TT-04, TT-05, TT-10, TT-11, TT-13, TT-17, TT-21, SA-01, SA-03, SA-05, SA-06, SA-07, SA-13, SA-14, SA-15, SA-16, SA-19, SA-21
- **Low:** TT-20, SA-12

## 5. Definition of Done

- All applicable applications build successfully.
- Type-checking, linting, formatting checks, and automated tests pass, except clearly documented pre-existing failures.
- Database migrations are reversible, safe for existing records, and do not silently discard data.
- New API behavior has authorization, validation, error handling, and regression coverage.
- UI fixes work at supported desktop and mobile widths and do not create console errors.
- Analytics totals reconcile across cards, charts, maps, and tables when the same filters are active.
- No secret, token, personal data, debug log, temporary bypass, or hardcoded production value is committed.
- `QA_REMEDIATION_REPORT.md` truthfully lists completed, partially completed, blocked, and not-started items with evidence.

## 6. Issue checklist and acceptance criteria

### [ ] TT-01 — Top Career Recommendations settings buttons are unresponsive

- **Area:** Functional
- **Severity:** High
- **Problem:** The settings buttons in the "Top Career Recommendations" area do not respond when clicked.
- **Required outcome:** Each settings button opens its intended configuration menu, modal, drawer, or options panel.
- **Acceptance criteria:**
  - Every visible settings button has a working click/keyboard handler.
  - The correct panel opens for the selected recommendation or setting.
  - The interaction works with mouse, keyboard, and touch where applicable.
  - No console error is produced.

### [x] TT-02 — FAQ Back to Home sends authenticated users to Login/Registration

- **Area:** Navigation
- **Severity:** High
- **Problem:** After registration, an authenticated user who opens FAQs and clicks "Back to Home" is redirected to Login/Registration instead of the Dashboard.
- **Required outcome:** For authenticated users, "Back to Home" routes to the Dashboard.
- **Acceptance criteria:**
  - An authenticated test taker is routed to the Dashboard.
  - An unauthenticated visitor follows the intended public/home route.
  - Route guards do not discard a valid authenticated session.
  - Add a regression test for both authenticated and unauthenticated states.

### [x] TT-03 — Remove Upload Qualifications from the user flow

- **Area:** Change Request
- **Severity:** Medium
- **Problem:** The "Upload Qualifications" step must be removed.
- **Required outcome:** The upload-qualifications interface, navigation step, validation, API calls, storage hooks, and dead code are removed without breaking onboarding.
- **Acceptance criteria:**
  - The step is absent from all user flows and progress indicators.
  - No qualification-upload field is required by front-end or back-end validation.
  - No orphan API request or storage operation is triggered.
  - Existing users and records remain readable; use a safe migration only if schema cleanup is necessary.

### [x] TT-04 — Prevent contradictory education-level and grade selections

- **Area:** Logic / Data
- **Severity:** Medium
- **Problem:** Users can save logically contradictory values, such as education level "Lower Than High School" while current/highest grade is a bachelor-level credential.
- **Required outcome:** Education-level and current/highest-grade values are validated as a consistent pair, and the obsolete Matric option is removed.
- **Acceptance criteria:**
  - Contradictory combinations are rejected before persistence.
  - Validation exists on both the client and server.
  - The user receives a clear field-level message explaining the conflict.
  - Existing valid records continue to load and save.

### [x] TT-05 — Update education-level dropdown options

- **Area:** Feature Request
- **Severity:** Medium
- **Problem:** The education-level list uses "Matric" and needs standardized options.
- **Required outcome:** Remove "Matric"; include "Lower Than High School", "High School Level", "IB Certificate", and retain other valid standardized options already required by the system.
- **Acceptance criteria:**
  - The same canonical option list is used across create, edit, filters, reports, and APIs.
  - Stored values use stable identifiers rather than display text where the architecture supports it.
  - Legacy Matric records are mapped safely or displayed compatibly without data loss.
  - TT-04 validation uses this canonical list.

### [x] TT-06 — Make OTP expiration consistent

- **Area:** Functional
- **Severity:** High
- **Problem:** OTP validity is inconsistent: some OTPs expire too early while others remain valid indefinitely.
- **Required outcome:** All OTPs use one strict server-enforced expiration window, preferably five minutes unless the repository already defines an approved value.
- **Acceptance criteria:**
  - Expiration is calculated and enforced on the server.
  - Expired OTPs cannot be reused or accepted.
  - Successful OTP use invalidates the token.
  - Resending an OTP follows a defined invalidation policy and does not leave unlimited valid tokens.
  - Tests cover valid, expired, reused, and resent OTPs.

### [ ] TT-07 — District/Town and Current School fields disable while editing

- **Area:** UI/UX
- **Severity:** High
- **Problem:** The "District/Town" and "Current School" combo boxes become disabled after each input/change.
- **Required outcome:** Both fields remain enabled and editable throughout the interaction.
- **Acceptance criteria:**
  - Typing, selecting, clearing, and correcting a value does not disable the field.
  - Loading state is scoped to data fetching and does not permanently lock the control.
  - Dependent-option loading does not erase a valid selection unexpectedly.
  - Keyboard and touch interaction remain usable.

### [x] TT-08 — Mandatory education/preferences fields can be saved empty

- **Area:** Validation
- **Severity:** High
- **Problem:** The Personal Education/Preferences edit screen allows mandatory fields to be submitted empty.
- **Required outcome:** Mandatory fields are enforced with clear client-side and server-side validation.
- **Acceptance criteria:**
  - Submission is blocked when a required field is empty or invalid.
  - Missing fields are visibly highlighted with accessible error text.
  - The first invalid field is focused or otherwise easy to locate.
  - The API rejects invalid payloads even when client validation is bypassed.

### [x] TT-09 — Invalid profile save redirects the user to onboarding

- **Area:** Validation
- **Severity:** High
- **Problem:** Saving an empty/invalid "District/Town" or "Current School" redirects the user to onboarding instead of blocking the save.
- **Required outcome:** The invalid save is rejected in place, a clear validation error is shown, and the authenticated session remains intact.
- **Acceptance criteria:**
  - No redirect occurs for a validation failure.
  - No partial invalid profile data is persisted.
  - The user remains on the edit screen with entered values preserved.
  - Route/session guards distinguish validation errors from missing onboarding state.

### [ ] TT-10 — Password visibility toggle clears the password

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** The show/hide password control clears the entered value on the change-password screen.
- **Required outcome:** The control only toggles the input type between "password" and "text".
- **Acceptance criteria:**
  - The exact value, caret position where practical, validation state, and focus are preserved.
  - The toggle has an accessible label and state.
  - The behavior works for every password field on the screen.

### [ ] TT-11 — Text-size tooltip is unreadable in high-contrast mode

- **Area:** Accessibility
- **Severity:** Medium
- **Problem:** The tooltip renders light-grey text on a white background in high-contrast mode.
- **Required outcome:** High-contrast styles provide clearly readable foreground/background contrast.
- **Acceptance criteria:**
  - The tooltip meets the application's accessibility contrast target.
  - The fix applies in all supported high-contrast themes/modes.
  - Focus, hover, and active states remain visible.
  - Do not fix one tooltip by breaking normal theme styling.

### [x] TT-12 — Help page Back to Home ignores navigation history

- **Area:** Navigation
- **Severity:** High
- **Problem:** Clicking "Back to Home" from Help sends the user to Login/Registration.
- **Required outcome:** The action returns the user to the page visited before Help; use a safe role-aware fallback when history is unavailable.
- **Acceptance criteria:**
  - Test takers return to their prior authenticated page or Dashboard fallback.
  - Admins return to their prior admin page or admin-dashboard fallback.
  - Public users follow the intended public fallback.
  - The implementation does not create a redirect loop.

### [ ] TT-13 — Glossary search filters but typed characters are invisible

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** The glossary search works internally, but the input does not visually display what the user types.
- **Required outcome:** The search value is correctly bound to state and rendered in real time.
- **Acceptance criteria:**
  - Typed, pasted, cleared, and programmatically reset values display correctly.
  - Filtering remains functional.
  - The input is not unintentionally transparent, clipped, or overwritten by theme CSS.
  - Add a component regression test where supported.

### [ ] TT-14 — Read Aloud blocks the glossary UI

- **Area:** Functional
- **Severity:** High
- **Problem:** Starting "Read Aloud" freezes or disables unrelated tabs and navigation.
- **Required outcome:** Text-to-speech runs asynchronously without blocking the interface.
- **Acceptance criteria:**
  - Users can navigate and interact with unrelated controls while speech is active.
  - Provide working play/stop or cancel behavior consistent with the current design.
  - Starting a second read action does not create uncontrolled overlapping speech tasks.
  - Unmount/navigation cleans up speech resources and listeners.

### [x] TT-15 — Contact details are missing from the Dashboard

- **Area:** Functional
- **Severity:** High
- **Problem:** Contact details stored in the user profile are not displayed on the Dashboard.
- **Required outcome:** The Dashboard fetches and renders the applicable contact details.
- **Acceptance criteria:**
  - Values come from the authenticated user's current profile data.
  - Missing optional values are handled gracefully.
  - Sensitive values are not exposed beyond what the existing product requirements permit.
  - Profile edits are reflected after the appropriate refresh/state update.

### [ ] TT-16 — Send Result to Email does not deliver

- **Area:** Functional
- **Severity:** High
- **Problem:** The "Send Result to Email" action triggers but no result email is delivered.
- **Required outcome:** The result email is correctly generated, queued/sent, and failures are surfaced accurately.
- **Acceptance criteria:**
  - Trace and fix the complete path: UI request, API validation, template generation, mail provider/SMTP call, and response handling.
  - The recipient, subject, result content, and attachments/links are correct.
  - Do not report success before the provider/queue accepts the message.
  - Log failures without leaking credentials or personal data.
  - Where live mail credentials are unavailable, add deterministic tests/mocks and clearly report that external delivery still requires environment verification.

### [x] TT-17 — Add Gender to Personal Information

- **Area:** Feature Request
- **Severity:** Medium
- **Problem:** The Personal Information profile section has no "Gender" field.
- **Required outcome:** Add a supported Gender selection to the schema, API, validation, create/edit forms, and relevant profile display.
- **Acceptance criteria:**
  - Use approved options such as "Male", "Female", "Other", and "Prefer not to say", aligned with existing business rules.
  - Use a nullable/optional strategy only if product rules allow it.
  - Provide a reversible migration and preserve existing users.
  - Do not expose the field in analytics or reports unless those views explicitly require it, except SA-20 where gender breakdown is requested.

### [ ] TT-18 — Interrupted registration locks the user out

- **Area:** Logic / Authentication
- **Severity:** Critical
- **Problem:** Interrupting registration can leave a partially created account that cannot log in or resume registration.
- **Required outcome:** Registration is resumable or safely recoverable, and partial records never permanently block the account.
- **Acceptance criteria:**
  - Define and enforce explicit registration/onboarding states.
  - A returning partially registered user can authenticate and resume at the correct step, or safely restart according to existing business rules.
  - Duplicate email/identity handling does not create conflicting accounts.
  - Transactions/compensating cleanup prevent inconsistent partial records.
  - Tests cover interruption at each meaningful registration step, browser refresh, logout, and subsequent login.
  - Do not weaken authentication or account-verification controls.

### [x] TT-19 — Password reset returns an internal server error

- **Area:** Functional / Authentication
- **Severity:** Critical
- **Problem:** Password reset fails for all users with "An internal server error occurred."
- **Required outcome:** Password-reset token generation, storage, dispatch, validation, and password update work for all supported user roles.
- **Acceptance criteria:**
  - Find and fix the actual backend exception; do not hide it behind a generic success response.
  - Tokens are random, single-use, securely stored/hashed where appropriate, and expire.
  - Responses do not reveal whether an account exists.
  - Reset links/codes use the correct environment base URL.
  - Tests cover valid reset, expired token, reused token, invalid token, unknown email, and each supported role.
  - A successful reset invalidates relevant prior sessions/tokens according to the security model.

### [x] TT-20 — Add an optional instructional video to FAQs

- **Area:** Feature Request
- **Severity:** Low
- **Problem:** Learners do not have an optional instructional video in the FAQ area.
- **Required outcome:** Add an accessible embedded video component that users may choose to play.
- **Acceptance criteria:**
  - Video loading is lazy and does not block the FAQ page.
  - Playback is optional and keyboard accessible.
  - The video source is configurable; do not invent or hardcode an unapproved production URL.
  - When no approved video URL exists, provide the configuration hook and a graceful hidden/empty state rather than fake content.

### [x] TT-21 — Use the full official title in Navigation and Certificates

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** Navigation and certificate headers do not show the full stakeholder-approved title.
- **Required outcome:** Use the wording "Pre-Service Tertiary Education & Training" in the relevant Navigation and Certificate sections.
- **Acceptance criteria:**
  - Use one shared constant/localization entry where practical.
  - Update generated/emailed/downloaded certificate variants as applicable.
  - Verify desktop, mobile, print, and PDF layouts do not clip the title.

### [ ] SA-01 — Map overlays the navigation bar

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** Map layers/controls have a higher z-index than the navigation bar and overlay the menu during scroll.
- **Required outcome:** The main navigation remains above map content without creating new stacking-context defects.
- **Acceptance criteria:**
  - Navigation, dropdowns, drawers, and modals remain visible over the map.
  - Map controls remain usable when the navigation is closed.
  - Verify desktop and mobile stacking contexts.

### [x] SA-02 — User Engagement metric excludes incomplete attempts

- **Area:** Logic / Math
- **Severity:** Critical
- **Problem:** The engagement calculation counts only users who finished the test and omits users who started but did not complete it.
- **Required outcome:** Any user with a qualifying test attempt is counted as engaged, whether the attempt is complete or incomplete.
- **Acceptance criteria:**
  - Use the existing approved denominator/business definition for engagement; change the numerator so qualifying attempted and completed users are included.
  - Count a user once even if they have multiple attempts, unless the current metric is explicitly attempt-based.
  - Document the exact formula implemented in code and in the remediation report.
  - Use consistent date, institution, region, user-type, and other active filters.
  - Add fixture-based tests for no attempt, incomplete attempt, completed attempt, and multiple attempts.
  - Do not guess a new denominator if the repository already contains a canonical metric definition.

### [x] SA-03 — Monthly SDS Adoption Trend omits days

- **Area:** UI / Data
- **Severity:** Medium
- **Problem:** The "Monthly SDS Adoption Trend" line chart shows sparse intervals instead of all days.
- **Required outcome:** The X-axis represents every day of the selected month, including zero-value days.
- **Acceptance criteria:**
  - Generate a complete calendar-day series for the selected month.
  - Zero-fill days with no events rather than omitting them.
  - Handle month length, leap years, time zone, and date-range boundaries correctly.
  - Labels remain readable on responsive layouts.

### [x] SA-04 — Holland Distribution hides tied top codes

- **Area:** Logic / Math
- **Severity:** High
- **Problem:** When multiple Holland/RIASEC codes share the top score, only one is displayed.
- **Required outcome:** Display all codes tied for the maximum score.
- **Acceptance criteria:**
  - Tie detection uses the same precision/rounding rules as displayed scores.
  - The API and UI both support multiple top codes.
  - Ordering is deterministic.
  - Tests cover two-way, multi-way, and no-tie results.

### [ ] SA-05 — Average RIASEC Score Share visualization is missing/broken

- **Area:** UI / Data
- **Severity:** Medium
- **Problem:** The National Insight Average RIASEC Score Share chart is missing, broken, or not rendering.
- **Required outcome:** Restore the chart and its data pipeline.
- **Acceptance criteria:**
  - The component renders with valid data, zero/empty data, loading, and error states.
  - All active filters are reflected.
  - RIASEC categories and values map correctly.
  - No chart-library runtime or console errors remain.

### [x] SA-06 — National Insight card kebab buttons do nothing

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** National Insight cards contain static/non-functional option buttons.
- **Required outcome:** Implement the intended actions when they already exist in the product design; otherwise remove the misleading controls.
- **Acceptance criteria:**
  - No visible control remains non-functional.
  - Implemented menus support keyboard navigation, focus management, and click-away/escape behavior.
  - Do not invent destructive or unsupported actions.

### [x] SA-07 — User Type filter contains duplicate values

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** National Insights repeats values such as "Student" or "Job Seeker" in the User Type filter.
- **Required outcome:** The filter displays one canonical option per user type.
- **Acceptance criteria:**
  - Deduplicate by stable identifier, not only display text.
  - Normalize whitespace/casing only where it does not merge genuinely distinct types.
  - The selected value still maps to the correct API parameter.

### [x] SA-08 — Date filter does not affect User Types metrics

- **Area:** Functional
- **Severity:** High
- **Problem:** Changing the National Insights date filter does not change User Types metrics.
- **Required outcome:** The selected date range is passed through the UI, API, query/service layer, and data aggregation.
- **Acceptance criteria:**
  - Changing the date range causes a deterministic refetch/recalculation.
  - Start/end boundaries and time zones match other dashboard metrics.
  - Clearing the filter returns the baseline dataset.
  - Tests verify at least two ranges with different expected results.

### [x] SA-09 — ECOT region is wrong and map/table data are unsynchronized

- **Area:** Data / Sync
- **Severity:** High
- **Problem:** The Detailed Institutional Usage Table places ECOT under Manzini, and regional values differ between the table and map.
- **Required outcome:** ECOT uses the canonical region from institution master data, and the map and table share the same filtered dataset/state.
- **Acceptance criteria:**
  - Correct the institution relation/seed/master record using repository-authoritative data; do not maintain two competing region mappings.
  - Do not hardcode a region only in the UI.
  - The map and table use the same filter inputs, query semantics, and aggregation rules.
  - A regression test verifies ECOT and at least one additional institution.
  - Document any data migration or cleanup performed.

### [x] SA-10 — University filter includes high schools

- **Area:** Data / Sync
- **Severity:** High
- **Problem:** The "University" filter in the Detailed Institutional Usage Table returns secondary/high schools.
- **Required outcome:** Institution classifications cleanly separate tertiary institutions from secondary schools.
- **Acceptance criteria:**
  - Use canonical classification identifiers.
  - Apply the filter server-side where practical, not only by hiding rows in the UI.
  - Existing institution records with inconsistent classifications are migrated or mapped safely.
  - Tests include university/college and high-school fixtures.

### [x] SA-11 — Institution filter has duplicate/broken entries

- **Area:** Data / Sync
- **Severity:** High
- **Problem:** The Institution dropdown contains duplicates, and one duplicate returns empty/broken results.
- **Required outcome:** Institution names/identifiers are standardized and each filter option maps to one valid institution.
- **Acceptance criteria:**
  - Remove or merge orphan/corrupt duplicate keys through a safe migration when required.
  - Preserve foreign-key references and historical analytics.
  - Dropdown options are deduplicated by canonical institution ID.
  - Selecting every displayed institution returns valid or legitimately empty data without query errors.

### [ ] SA-12 — Detailed Institutional Usage Table columns are misaligned

- **Area:** UI/UX
- **Severity:** Low
- **Problem:** Headers, text, numbers, and dates use inconsistent alignment.
- **Required outcome:** Text columns align left; metrics, dates, and numbers align right or center consistently according to the design system.
- **Acceptance criteria:**
  - Header alignment matches its column data.
  - Sorting/filter icons do not disturb alignment.
  - Responsive and narrow layouts remain readable.

### [x] SA-13 — Career Overview, Regional Map, and Trends n Segmentation option buttons do nothing

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** Card option buttons in these sections are non-functional.
- **Required outcome:** Wire them to approved menu actions or remove them.
- **Acceptance criteria:**
  - No dead controls remain.
  - Use one shared card-menu pattern where applicable.
  - Do not invent actions not supported by existing requirements or code.

### [ ] SA-14 — Funding Alignment Distribution labels overlap

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** Chart labels overlap and become unreadable.
- **Required outcome:** Use responsive dimensions, padding, wrapping/truncation, tooltips, label angle, or an appropriate chart layout to keep labels legible.
- **Acceptance criteria:**
  - Verify representative short and long labels.
  - No label overlaps another label or data mark at supported widths.
  - Full values remain discoverable via tooltip/accessible text if labels are truncated.

### [ ] SA-15 — SLAS priority vs other labels bleed into bars

- **Area:** UI/UX
- **Severity:** Medium
- **Problem:** Labels in the "SLAS priority vs other" chart overlap the visualization.
- **Required outcome:** Adjust layout, margins, wrapping, or use a horizontal bar arrangement so labels do not bleed into bars.
- **Acceptance criteria:**
  - Verify desktop, tablet, and mobile widths.
  - Values and category names remain readable and accessible.
  - The chart does not introduce horizontal page scrolling.

### [x] SA-16 — Notification badge is hardcoded/stuck at 1

- **Area:** Functional
- **Severity:** Medium
- **Problem:** The admin notification indicator always displays "1".
- **Required outcome:** The badge reflects the actual unread count (`is_read = false`) from the data source.
- **Acceptance criteria:**
  - The count loads on initial render and updates after read/mark-all-as-read actions.
  - Zero unread notifications hide the badge or display zero according to the existing design.
  - Race conditions do not restore stale counts.
  - Use an efficient count query rather than loading all notifications solely to count them.

### [ ] SA-17 — Result email layout is not responsive

- **Area:** UI/UX
- **Severity:** High
- **Problem:** The HTML result email breaks on mobile and causes horizontal scrolling.
- **Required outcome:** Rebuild/fix the email using email-client-safe responsive HTML, fluid tables/grids, inline CSS, and conservative media queries.
- **Acceptance criteria:**
  - The email is readable at common mobile widths without horizontal scrolling.
  - Critical content remains readable when media queries are ignored.
  - Use email-compatible markup rather than relying on unsupported web CSS.
  - Verify the generated HTML snapshot and, where tooling exists, multiple email-client previews.
  - Keep TT-16 delivery behavior intact.

### [ ] SA-18 — Add Admin FAQ Management

- **Area:** Feature Request
- **Severity:** High
- **Problem:** Admins cannot dynamically add, edit, and publish FAQs from the system.
- **Required outcome:** Provide an authorized Admin FAQ Management interface with create, edit, publish/unpublish, ordering if supported, and safe display in the test-taker FAQ area.
- **Acceptance criteria:**
  - Only authorized admin roles can mutate FAQs.
  - Validate and sanitize FAQ content.
  - Support draft/published state or the closest existing content-state model.
  - Published changes appear in the user-facing FAQ without redeployment.
  - Integrate with existing support-query/log data if such a model already exists; do not invent a fake integration.
  - Add API/service and permission tests plus UI CRUD coverage.

### [x] SA-19 — Mark all as read does not update notifications

- **Area:** Functional
- **Severity:** Medium
- **Problem:** The admin "Mark all as read" button does not change notification read status.
- **Required outcome:** The action updates all applicable unread notifications to `is_read = true` and immediately refreshes the UI/badge.
- **Acceptance criteria:**
  - The API scopes the update to the authenticated admin/user as required.
  - The operation is idempotent.
  - Success and failure states are shown accurately.
  - SA-16 unread count becomes correct after the operation.
  - Add authorization and data-state tests.

### [x] SA-20 — Analytics lack granular demographic and completion breakdowns

- **Area:** Analytics
- **Severity:** High
- **Problem:** Reporting is too aggregated for detailed analysis.
- **Required outcome:** Add breakdowns by age group, gender, geographical region, and completion status.
- **Acceptance criteria:**
  - Use documented bucket definitions and canonical dimensions already present in the repository.
  - Every breakdown respects the same active filters and date boundaries.
  - Totals reconcile with the corresponding aggregate metric.
  - Handle unknown/not-provided values explicitly instead of silently dropping them.
  - Avoid exposing personally identifiable row-level data in aggregate dashboards.
  - Add query/aggregation tests and empty-state handling.

### [x] SA-21 — Remove Grade from two admin reports

- **Area:** Change Request
- **Severity:** Medium
- **Problem:** The "Grade" field appears in Regional Performance Scorecard and Institution Performance Ranking (by Completion Rate).
- **Required outcome:** Remove the Grade column/filter from both views and related exports where applicable.
- **Acceptance criteria:**
  - No empty spacing, stale sort state, query parameter, or export column remains.
  - Other report fields and saved filters continue to work.
  - Back-end selection/projection is simplified if Grade is no longer needed.

### [x] SA-22 — Admin user profiles show institution hash/ID instead of name

- **Area:** Data / UI
- **Severity:** High
- **Problem:** User-management cards display an institution identifier/hash rather than the human-readable institution name.
- **Required outcome:** Resolve the institution relationship and render the canonical display name.
- **Acceptance criteria:**
  - Use a proper relation/join/lookup; do not attempt to visually format or 'decrypt' an identifier unless the repository truly uses encryption.
  - Handle missing/deleted institutions gracefully.
  - Avoid N+1 queries.
  - The API returns a stable institution ID and a separate display name where appropriate.

### [ ] SA-23 — Admins are randomly redirected to Login/Registration

- **Area:** Logic / Authentication
- **Severity:** High
- **Problem:** Authenticated admins are intermittently ejected from active admin-console navigation.
- **Required outcome:** Session/token refresh and route guards maintain a valid admin session and only redirect after a real authentication/authorization failure.
- **Acceptance criteria:**
  - Find the root cause: token expiry/refresh race, guard initialization, failed API handling, storage synchronization, or role-state hydration.
  - Do not treat every transient API error as authentication failure.
  - Concurrent requests trigger at most one refresh flow where relevant.
  - A failed refresh clears state safely and redirects once.
  - Tests cover page refresh, deep links, token renewal, multiple concurrent requests, and true expiry.

### [ ] SA-24 — Mobile admin menu opens outside the current viewport

- **Area:** Mobile UX
- **Severity:** High
- **Problem:** On mobile, toggling the admin menu opens it at the top of the document, forcing the user to scroll upward.
- **Required outcome:** The mobile menu opens immediately within the current viewport using fixed/overlay positioning.
- **Acceptance criteria:**
  - The menu is visible regardless of scroll position.
  - Body scroll, focus trapping, backdrop, escape/close action, and screen-reader labeling follow the existing design pattern.
  - Closing the menu restores focus to the toggle.
  - The overlay does not sit behind maps/charts/navigation.

### [x] SA-25 — Clearing analytics filters produces zero metrics

- **Area:** Data / State
- **Severity:** High
- **Problem:** Removing active filters causes metric cards to show zero instead of restoring the unfiltered baseline.
- **Required outcome:** Resetting filters clears parameters and refetches/recalculates the default dataset.
- **Acceptance criteria:**
  - No stale empty filter value is sent as a restrictive query.
  - All dependent cards/charts/tables return to one consistent unfiltered state.
  - Loading state is shown during refetch rather than flashing false zero values.
  - Tests cover apply, change, clear one, and reset all filters.

### [x] SA-26 — Institution summary metrics do not respond to filters

- **Area:** Data / Filter
- **Severity:** High
- **Problem:** Under System Admin > Settings > Institutions, summary values such as "76 / 399 · 5 pending" remain based on overall totals after region/classification filters are applied.
- **Required outcome:** Summary and pending counts are recalculated from the same actively filtered institution dataset.
- **Acceptance criteria:**
  - Every active region/classification/search/status filter affects both the list and summary metrics.
  - The denominator and pending count semantics are documented and consistent.
  - Clearing filters restores overall totals.
  - Avoid client-side counts that disagree with paginated/server-filtered totals.
  - Add tests for at least one region and one classification filter.

## 7. Required final report

Create `QA_REMEDIATION_REPORT.md` with the following structure:

```md
# SDS QA Remediation Report

## Environment and repository summary
- Applications/packages:
- Front-end stack:
- Back-end stack:
- Database/migrations:
- Authentication/session model:
- Test commands:

## Baseline results
- Build:
- Type-check:
- Lint:
- Unit/integration/E2E tests:
- Pre-existing failures:

## Issue status
| ID | Status | Root cause | Fix implemented | Main files | Tests/evidence | Assumptions or blocker |
|---|---|---|---|---|---|---|
| TT-01 | Complete / Partial / Blocked / Not started | ... | ... | ... | ... | ... |

## Database and configuration changes
- Migrations:
- Seed/reference-data changes:
- New environment variables:
- Deployment steps:

## Commands run and final results
```

For each issue marked **Complete**, include concrete evidence such as a test name, command result, reproducible manual path, API response, screenshot reference, or query fixture. Never use **Complete** for code that was changed but not verified.

## 8. Completion behavior

- Work through the entire checklist without waiting for confirmation after each item.
- When requirements are ambiguous, inspect existing business logic, labels, tests, schemas, and nearby components first. Choose the smallest consistent interpretation and document it.
- When an item depends on unavailable external content or credentials, complete all code/test work possible, mark only the external verification as blocked, and state exactly what is needed.
- Update `[ ]` to `[x]` in a working copy of this checklist only after the item meets its acceptance criteria.
- At the end, summarize the highest-risk changes, migrations, deployment/configuration requirements, and any unresolved blockers.
