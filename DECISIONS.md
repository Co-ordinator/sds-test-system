# DECISIONS.md

Architecture and product decision log for the SDS Test System.

## 1. Use OTP For Registration Verification

**Decision:** Replace email verification links with a 6-digit OTP flow.

**Why:** Users had trouble with verification emails and link flows. OTP lets users copy the code back into the already-open registration flow.

**Tradeoffs:**

- Better UX for mobile users and restricted email/browser environments.
- Requires resend cooldown and OTP expiry.
- Email deliverability still depends on sender reputation.

**Do not reverse casually:** Do not return to link-only verification without explicit approval.

## 2. Use OTP For Forgot Password

**Decision:** Forgot-password flow also uses OTP.

**Why:** Consistent with registration verification and easier for users to understand.

**Tradeoffs:**

- More backend token state in user fields.
- Requires clear UI for requesting/resending OTP.

**Do not reverse casually:** Keep reset OTP templates and endpoint behavior unless a new auth design is approved.

## 3. Remove Auth/IP Blockers That Break Registration

**Decision:** Global API rate limiter skips `/api/v1/auth/*`; CAPTCHA is optional/disabled unless env configured.

**Why:** Users on shared networks or restricted environments were blocked from registering/resetting passwords.

**Tradeoffs:**

- Less aggressive public endpoint throttling.
- Abuse protection should be revisited with user-friendly CAPTCHA/risk checks if needed.

**Do not reverse casually:** Avoid reintroducing IP-only blockers that affect registration, OTP, login, or password reset.

## 4. Passwords Minimum 6 Characters, Any Characters Allowed

**Decision:** Password validation requires at least 6 characters and accepts all characters.

**Why:** Users wanted strong passwords with symbols and no unrealistic composition restrictions. Later requirement specifically requested 6+ and everything accepted.

**Tradeoffs:**

- Shorter minimum than modern high-security recommendations.
- Better user compatibility.

**Do not reverse casually:** If strengthening password policy, ask first and update every frontend/backend entry point together.

## 5. Keep Onboarding Mandatory For Self-Registered Test Takers

**Decision:** Users cannot bypass onboarding after OTP verification by returning to login.

**Why:** Missing onboarding data causes bad dashboards, reports, certificates, institution/region analytics, and recommendations.

**Tradeoffs:**

- More friction after registration.
- Higher data quality.

**Do not reverse casually:** Onboarding gating is core to data/report accuracy.

## 6. Imported Learner Login Cards Are Valid Alternative Access

**Decision:** Test Administrators can import learners and generate login cards with login number and temporary password.

**Why:** Some high school learners do not have emails. Login cards let them access the system.

**Tradeoffs:**

- Import data quality becomes very important.
- Temporary passwords must be shown once on cards and user should change password if required.

**Do not reverse casually:** This is an inclusion requirement for learners without email.

## 7. Imported Learner Profiles Must Carry Institution And Region

**Decision:** Imported learners should inherit matched institution and region so profile, reports, certificate, and analytics are not blank.

**Why:** Certificates and admin reporting depend on school/region/institution.

**Tradeoffs:**

- Institution matching logic must be tolerant but not ambiguous.
- Bad CSV names need clear errors/suggestions.

## 8. Seed Schools And Tertiary Institutions From Docs

**Decision:** Remove dummy school/institution placeholders and seed real Eswatini schools and tertiary institutions from repo docs.

**Why:** Admin filters, onboarding, certificates, and analytics need real institutions.

**Tradeoffs:**

- Seed data must be maintained from source documents.
- Institution type taxonomy matters for KPIs and filtering.

**Do not reverse casually:** Do not replace seeded institutions with dummy data.

## 9. Recommendations Must Respect User Group

**Decision:** High school, tertiary, and professional results should not be identical.

**Why:** Guidance differs by life stage. Professionals should not receive high-school subject recommendations as primary advice.

**Tradeoffs:**

- Recommendation logic is more complex.
- Requires good user type/onboarding data.

## 10. Use Priority List And Holland Occupational Codes

**Decision:** Use priority-list data and Holland occupational code source data to improve result accuracy and funding alignment.

**Why:** Recommendations must match the Holland Code and avoid irrelevant career/course results.

**Tradeoffs:**

- Data extraction/seeding is significant.
- Duplicates must be deduplicated for quality.

**Do not reverse casually:** Recommendation quality depends on these datasets.

## 11. Treat Holland Code Ties Explicitly

**Decision:** Codes with ties such as `I A R/C` must display and interpret tied letters.

**Why:** Dropping tied letters misrepresents results.

**Tradeoffs:**

- Display/parser logic is more complex.
- PDFs and UI must keep tied code display consistent.

## 12. Glossary Terms Support Assessment Comprehension

**Decision:** Glossary terms are not only a page feature; they should appear in questionnaire text where relevant and support voice definitions.

**Why:** Test takers may not understand terms in SDS questions, especially on mobile.

**Tradeoffs:**

- Text highlighting must avoid false matches.
- Glossary filtering and categories must be accurate.

## 13. Accessibility Settings Are Per Account

**Decision:** Accessibility settings should persist per account and should not leak between accounts in the same browser.

**Why:** Screen reader/high contrast/other settings are personal preferences.

**Tradeoffs:**

- Requires careful auth-context synchronization.
- Local storage or global state cannot blindly carry settings across sessions.

## 14. Admin Analytics Must Use Real Data Only

**Decision:** Admin dashboards and graphs must not use dummy/hard-coded fake insights.

**Why:** System is used for ministry reporting and stakeholder decisions.

**Tradeoffs:**

- Empty states may appear when data is limited.
- Queries/filtering need more care.

## 15. Merge Analytics Into Admin Dashboard

**Decision:** Analytics sections/tabs should live under admin dashboard rather than a separate analytics tab.

**Why:** User wanted old KPI dashboard as landing/overview plus analytics tabs inside dashboard.

**Tradeoffs:**

- Dashboard component becomes larger.
- Naming of "overview" sections must be clear.

## 16. Keep Landing Page Recognizable But Professional

**Decision:** Current landing page should not be drastically changed without approval; improve carefully.

**Why:** Client became used to the landing page after many iterations.

**Tradeoffs:**

- Design modernization must preserve familiarity.
- Avoid making page too dark, childish, or cramped.

## 17. Backend Owns PDF/Certificate Assets

**Decision:** Backend-generated PDFs/certificates require assets deployable with backend, not only frontend `public`.

**Why:** On Hostinger, images disappeared unless manually copied into backend Node assets.

**Tradeoffs:**

- Asset duplication or build-copy logic required.
- Deployment docs must mention assets.

**Do not reverse casually:** PDFs/certificates must work on hosted backend.

## 18. Results PDF Should Be Official Document Style

**Decision:** Assessment PDF should be clean, professional, restrained, and max 4 pages.

**Why:** Card-heavy, colorful, childish layouts looked unprofessional and had clamped text.

**Tradeoffs:**

- Less visually playful.
- More like a formal report.

**Do not reverse casually:** Keep report clear and official unless stakeholder requests a new design.

## 19. Email Templates Should Be Simple Transactional Notices

**Decision:** OTP email templates should avoid suspicious-looking card-heavy layouts, excessive links/buttons, and marketing language.

**Why:** Gmail was sending OTP emails to spam and marked messages as similar to spam.

**Tradeoffs:**

- Less branded/visual email.
- Better chance of being treated as transactional.

**Note:** Real deliverability still requires sender reputation and SPF/DKIM/DMARC for domain email.

## 20. Keep `notificationsdatamatics@gmail.com` Aligned In SMTP

**Decision:** SMTP user, from email, and reply-to are aligned to `notificationsdatamatics@gmail.com`.

**Why:** Avoid sender mismatch from old domains and reduce spam suspicion.

**Tradeoffs:**

- Gmail account reputation controls deliverability.
- A verified domain sender would be better long-term.

## 21. Preserve Reference Documents In Repo

**Decision:** Reference documents in `docs/` should be committed so collaborators can understand/verify seeded data.

**Why:** Schools, institutions, priority list, glossary, and Holland occupation data came from documents.

**Tradeoffs:**

- Repo can be larger.
- Sensitive/copyright status of large source documents should be checked before public sharing.

## 22. Do Not Auto-Mutate Existing Incomplete Users

**Decision:** Existing users marked onboarded but missing required fields should be audited/reported rather than automatically modified.

**Why:** Avoid unexpected production data changes.

**Tradeoffs:**

- Some bad historical rows may remain until manually fixed.
- Safer for live data.

## 23. Make Certificate Profile Context Role-Aware And Immutable

**Decision:** Build certificate wording from the assessment's test-taker type. High-school and university certificates use the recorded institution; professional certificates use the recorded occupation, workplace, district, and region. Capture that non-sensitive context in `assessments.certificate_profile_snapshot` when an assessment is first completed.

**Why:** Professional onboarding intentionally does not populate student institution fields, so the previous student-only sentence produced missing or stale school details. Reading only the live user profile also allowed a later school, occupation, or workplace change to rewrite an older certificate.

**Tradeoffs:**

- A non-destructive database migration is required before deploying the updated backend.
- Existing completed assessments cannot be historically reconstructed safely; they use the current live profile only when no snapshot exists.
- The snapshot deliberately excludes national ID/PIN and residential address. Identity remains sourced from the protected user record.

**Do not reverse casually:** Do not use `currentInstitution` for professionals, do not print `NOT SPECIFIED` on official certificates, and do not backfill historical snapshots without an approved data-audit process.

## 24. Keep The Client-Preferred Established UI

**Decision:** The contributor's broad replacement UI was reverted because the client explicitly preferred the established/previous UI. The current UI is the approved product baseline.

**Why:** The client had already reviewed and become familiar with the established landing page, navigation, dashboards, and role journeys. The replacement design changed that experience without reflecting the client's final preference.

**Tradeoffs:**

- Functional fixes from contributor commits must be ported selectively when they overlap visual files.
- Future UI modernization should be incremental and explicitly approved.
- Conflict resolution should favor the current client-approved UI while retaining compatible reliability, accessibility, security, and data fixes.

**Do not reverse casually:** Do not reapply the contributor's `9338d29` (`new design`) commit or replace the current UI wholesale without explicit client approval.

## Unconfirmed / Needs Verification

- Whether a future domain email such as `notifications@datamatics.co.sz` will replace Gmail.
- Whether multi-language/siSwati support will be implemented and what translation provider will be used.
- Whether all source/reference documents are legally safe to keep in a public repository.
