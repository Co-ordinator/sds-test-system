# SDS Test System – Review: Missing Pages and Functionality

This document reviews the Ministry of Labour's Self-Directed Search (SDS) Test System codebase against a complete, production-ready system and lists **missing pages**, **missing or broken functionality**, and **API/frontend mismatches**.

---

## 1. Critical: Broken Imports (App Won’t Start)

| Issue | Detail |
|-------|--------|
| **Missing `SdsTest` page** | `App.js` imports `./pages/SdsTest` but the file **does not exist**. The codebase has `Questionnaire.jsx` instead (a stub with 6 mock questions). |
| **Wrong admin path** | `App.js` imports `./pages/admin/Dashboard` but there is **no `pages/admin/`** folder. The only dashboard file is `pages/AdminDashboard.jsx`. |

**Required fix:** Either create `pages/SdsTest.jsx` (and optionally `pages/admin/Dashboard.jsx`) or change `App.js` to import `Questionnaire` and `AdminDashboard` from their actual paths (e.g. `./pages/Questionnaire`, `./pages/AdminDashboard`).

---

## 2. Missing Backend Route File

| Issue | Detail |
|-------|--------|
| **`result.routes.js` missing** | `backend/src/app.js` does `require('./routes/result.routes')` and mounts `/api/v1/results`, but **`backend/src/routes/result.routes.js` does not exist**. Only these route files exist: `auth.routes.js`, `admin.routes.js`, `counselor.routes.js`, `institution.routes.js`. |

**Effect:** The backend will throw when loading routes (e.g. `Cannot find module './routes/result.routes'`) and will not start.

**Required fix:** Add `result.routes.js` that mounts the assessment/results API (e.g. get results by assessment ID, PDF report, recommendations) and wire it to `AssessmentController` (and any result-specific handlers). See Section 5 for the assessment/results API that is currently unimplemented at route level.

---

## 3. Assessment / Test-Taking API Not Exposed

The **API documentation** describes:

- `POST /attempts` – start new test attempt  
- `GET /attempts/:id` – get attempt details  
- `PATCH /attempts/:id` – update progress  
- `POST /attempts/:id/responses` – submit answers  
- `POST /attempts/:id/complete` – complete attempt  

**Current backend state:**

- **AssessmentController** exists and implements:
  - `saveProgress(assessmentId, answers)` – bulk upsert answers, update progress %
  - `submitAssessment(assessmentId)` – finalize (228 answers), compute Holland code and recommendations
  - `getResults(assessmentId)` – return results and recommendations
- **No route file** mounts this controller. There are no `/attempts` or `/assessments` routes.
- **No “start assessment”** logic: nothing creates an `Assessment` record (e.g. `Assessment.create({ userId, status: 'in_progress' })`).

So the following are **missing**:

1. **Route module** for assessments/attempts (e.g. `assessment.routes.js` or under `result.routes.js`).
2. **Endpoint to start an assessment** (e.g. `POST /api/v1/assessments` or `POST /api/v1/attempts`) that creates an in-progress assessment for the current user.
3. **Endpoints** that call:
   - `saveProgress` (e.g. `POST /api/v1/assessments/:id/progress` or `PATCH /attempts/:id` + `POST /attempts/:id/responses`).
   - `submitAssessment` (e.g. `POST /api/v1/assessments/:id/complete`).
4. **Endpoints to list** the current user’s assessments (e.g. for dashboard “in progress” / “completed”) and to get one attempt by id.

Until these exist, no frontend can start a test, save answers, or complete the SDS flow via the API.

---

## 4. Results API and PDF Report

**Documented:**

- `GET /results/:attemptId` – get test results  
- `GET /results/:attemptId/report` – PDF report  
- `GET /results/:attemptId/recommendations` – career recommendations  

**Current state:**

- Results route file is missing (Section 2).
- `AssessmentController.getResults` can serve “get results” and recommendations (recommendations are already returned by the scoring service). So **get results** (and optionally a dedicated **recommendations** endpoint) can be implemented once result routes exist.
- **PDF report** – no implementation found in the codebase (no PDF generation for `.../report`). This is **missing functionality**.

---

## 5. Frontend Pages: Missing or Not Wired

### 5.1 Pages that exist but are **not in `App.js` routes**

| Page | File | Intended use | Issue |
|------|------|--------------|--------|
| **Profile** | `Profile.jsx` | User profile and data subject rights | No route (e.g. `/profile`) in `App.js`. Users cannot open the profile page. |
| **Test taker dashboard** | `TestTakerDashboard.jsx` | Student: “Resume test”, history, progress | No route (e.g. `/dashboard` or `/student`). Not linked from anywhere. |
| **Counsellor dashboard** | `CounsellorDashboard.jsx` | Counselor: students, recent tests, export | Not used. `App.js` sends both admin and counselor to the same `AdminDashboard` at `/admin/*`. So counselors never see the dedicated CounsellorDashboard. |

**Recommendation:** Add routes for `/profile` and a student dashboard (e.g. `/dashboard`), and use them in the nav. For counselors, either use `CounsellorDashboard` when role is `counselor` (e.g. under `/admin/*` or `/counselor`) or merge its features into the admin dashboard.

### 5.2 Pages that are stubs or use mock data

| Page | Issue |
|------|--------|
| **Questionnaire (intended SdsTest)** | Only 6 questions, one mock question, 1–5 scale. Real SDS has 228 questions in 4 sections (Activities, Competencies, Occupations, Self-Estimates) with Yes/No and 1–6 self-estimates. Not connected to any assessment API. |
| **TestResults** | All data is hardcoded (RIASEC scores, Holland codes, career list). No `GET /results/:attemptId` (or similar) call. Does not show the user’s actual assessment result. |
| **TestTakerDashboard** | Mock “test history” and “65% progress”. No API calls to list assessments or get progress. “Resume Test” does not navigate to a real assessment session. |
| **AdminDashboard** | “Total Users”, “Tests Completed”, “Active Users” are hardcoded (e.g. 15,245; 8,912). Tabs “users”, “reports”, “settings” are not fully implemented (only institutions tab uses API). No real user list, analytics, or audit logs from backend. |
| **CounsellorDashboard** | “Recent tests” and “Appointments” are mock. Calls `GET /api/v1/results/export` which does not exist (result routes missing). |

So for a **complete** SDS system, these pages need to be implemented against the real APIs (assessments, results, admin users/analytics/audit, counselor students/export).

---

## 6. Profile and Data Subject Rights

### 6.1 Profile API mismatch

- **Profile.jsx** uses:
  - `GET /api/v1/auth/users/me`  
  - `PATCH /api/v1/auth/users/me`
- **Backend** only has:
  - `GET /api/v1/auth/me` (get current user)
  - No `PATCH` for profile update.

So:

1. **GET profile:** Frontend path is wrong; should call `GET /api/v1/auth/me`. Response shape may also be `{ data: { user } }`; frontend should use that.
2. **PATCH profile:** Backend endpoint and handler (e.g. `PATCH /api/v1/auth/me` or `PATCH /api/v1/auth/users/me`) are **missing**. Profile updates will fail until this is added.

### 6.2 Data export and account deletion (GDPR-style)

- Backend **has**:
  - `GET /auth/users/me/export` – export user data  
  - `DELETE /auth/users/me/account` – delete account  
- Frontend: **No dedicated UI** found for “Export my data” or “Delete my account” (e.g. on Profile or Settings). So data subject rights are implemented in API only, not exposed in the app.

**Recommendation:** Add Profile route (Section 5.1), fix profile GET/PATCH (Section 6.1), and add buttons/flow for “Export my data” and “Delete my account” that call these endpoints.

---

## 7. Forgot Password Payload

- **Frontend** (`ForgotPassword.jsx`) sends `{ identifier }` (email or national ID).
- **Backend** (`auth.controller.js` `forgotPassword`) uses `req.body.email` only.

So if the user enters a national ID, the backend will not find the user. Either the backend should accept `identifier` and resolve to email (or user), or the frontend should send `email` and the UI should ask for email only.

---

## 8. Checklist: What a Complete SDS System Would Include

Use this to track completeness.

### 8.1 Backend

- [ ] **result.routes.js** – mount results (and optionally assessment) endpoints.
- [ ] **Assessment/attempts routes** – start assessment, save progress, submit (complete), list my attempts.
- [ ] **Start-assessment** – create `Assessment` for current user (e.g. one in-progress per user or per “attempt”).
- [ ] **GET/PATCH profile** – align with frontend (path and body) and implement PATCH.
- [ ] **PDF report** – implement `GET /results/:id/report` (e.g. with a PDF library).
- [ ] **Forgot password** – accept `identifier` (email or national ID) or standardize on `email` and update frontend.

### 8.2 Frontend

- [ ] **Fix App.js** – correct imports for SdsTest/Questionnaire and admin Dashboard so the app starts.
- [ ] **Routes** – add `/profile`, student dashboard; decide counselor view (CounsellorDashboard vs AdminDashboard).
- [ ] **SDS test page** – full 228-question flow by section (Activities, Competencies, Occupations, Self-Estimates), Yes/No and 1–6, wired to start/save/complete assessment API.
- [ ] **Test results page** – load real results from API (scores, Holland code, recommendations); optional PDF download.
- [ ] **Student dashboard** – list assessments (in progress/completed), resume test, link to results.
- [ ] **Admin dashboard** – real users list, analytics, audit logs, and reports from backend.
- [ ] **Counsellor dashboard** – real students and tests (counselor API), and export if backend provides it.
- [ ] **Profile page** – use `GET /auth/me`, implement PATCH (once backend exists), add “Export my data” and “Delete my account”.

### 8.3 Optional / Nice-to-have

- [ ] siSwati translations (mentioned in docs).
- [ ] Email results (button on TestResults).
- [ ] Accessibility (WCAG) and any `accessibilityNeeds` handling in UI.
- [ ] Rate limiting and security hardening (some middleware exists; verify coverage).

---

## 9. Summary Table

| Area | Status | Action |
|------|--------|--------|
| App.js imports | Broken | Use Questionnaire + AdminDashboard paths or add missing SdsTest + admin/Dashboard. |
| result.routes.js | Missing | Create and mount results (and optionally assessments). |
| Start/save/complete assessment | Not exposed | Add assessment/attempts routes and “start assessment” creation. |
| Results + recommendations API | Logic exists, not mounted | Expose via result routes; add PDF later. |
| Profile GET/PATCH | GET path wrong; PATCH missing | Fix path to `/auth/me`; add PATCH profile and align frontend. |
| Profile + data rights UI | Missing | Add profile route and Export/Delete account UI. |
| Questionnaire / SdsTest | Stub | Implement full 228-question SDS and wire to API. |
| TestResults | Mock | Wire to real results API. |
| TestTakerDashboard | Mock, no route | Add route and wire to assessments API. |
| AdminDashboard | Partially mock | Wire users, analytics, audit logs, reports. |
| CounsellorDashboard | Not used; mock + missing export | Use for counselors; wire to counselor + result export API. |
| Forgot password | Payload mismatch | Unify on `email` or support `identifier` on backend. |

This should give the Ministry of Labour a clear list of missing pages and functionality for a complete SDS test system and the order in which to fix them (fix broken imports and result routes first, then assessment flow, then dashboards and profile).
