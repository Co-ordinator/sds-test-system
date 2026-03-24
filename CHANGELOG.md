# Changelog

All notable changes to the SDS (Self-Directed Search) Assessment System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.14.2] - 2026-03-24

### Added — Full Glossary Page with Learning Tracking

#### ✨ **New Feature**
- **Full Glossary Page**: Replaced bottom sheet with comprehensive full-page glossary at `/glossary`
- **Enhanced UI**: Split-view layout with term list on left, detailed view on right
- **Learning Progress**: Visual progress tracking showing percentage of terms learned
- **Advanced Features**:
  - Category filtering (RIASEC Types, Assessment Terms, Activity Words, Occupations)
  - Real-time search across terms, definitions, and examples
  - Text-to-speech functionality for accessibility
  - Related terms navigation
  - Difficulty indicators and section badges

#### 🛠 **Technical Improvements**
- **Performance Fixes**: Eliminated infinite re-render loops in glossary components
- **Architecture**: Separated pure data access from behavioral tracking in useGlossary hook
- **Memory Management**: Implemented debounced localStorage saves (300ms)
- **Immutable Operations**: Fixed array mutation issues that caused render loops

#### 🎨 **UI/UX Enhancements**
- **Navigation**: Added glossary links to both Test Taker and Admin navigation menus
- **Responsive Design**: Mobile-friendly layout with proper breakpoints
- **Accessibility**: Screen reader support, keyboard navigation, high contrast mode
- **Visual Hierarchy**: Clear typography, consistent spacing, government theme compliance

#### 🗑 **Cleanup**
- **Removed Components**: Deleted `GlossaryBottomSheet.jsx` and unused `glossaryUtils.js`
- **Route Management**: Added protected route `/glossary` for all authenticated users
- **Breadcrumb System**: Added breadcrumb mapping for glossary page

#### 🔧 **Backend Integration**
- **Hook Refactoring**: Made `getTermDefinition` pure, moved side effects to `handleTermView`
- **State Management**: Proper separation of data retrieval and user interaction tracking
- **Performance**: Memoized expensive operations, eliminated circular dependencies

#### 🐛 **Bug Fixes**
- **Compilation Error**: Fixed module not found error in Questionnaire.jsx by removing GlossaryBottomSheet import and updating navigation to use full glossary page
- **Navigation**: Updated questionnaire glossary button to navigate to `/glossary` instead of opening bottom sheet

---

## [2.14.1] - 2026-03-24

### Fixed — Email Verification "Invalid Token" UX Issue

#### 🐛 **Bug Fix**
- **Email Verification Flow**: Fixed issue where clicking an expired/already-used verification link would show "Token is invalid or has expired" error even when the email was already verified
- **Root Cause**: Backend logic looked for users by `emailVerificationToken` after verification, but tokens are cleared to `null` when verification succeeds
- **Solution Implemented**:
  - **Backend (auth.service.js)**: Updated `verifyEmail` method to detect recently verified users (within 1 hour) when token lookup fails
  - **Frontend (VerifyEmail.jsx)**: Added new `alreadyVerified` status with dedicated UI showing success message and "Go to Login" button
  - **Better UX**: Users now see appropriate success messaging instead of confusing error messages

#### 🎯 **Impact**
- **Clear User Experience**: Users with already verified emails see success message instead of error
- **Proper Navigation**: Directs users to login page when verification is already complete
- **Consistent Behavior**: Handles edge cases where users click old verification links

### Enhanced — Email Verification Auto-Navigation

#### ✨ **User Experience Improvement**
- **Unified Flow**: Both successful verification and already verified cases redirect to onboarding
- **Smart Authentication**: Onboarding page handles unauthenticated users by redirecting to login with context message
- **Seamless Transition**: After successful email verification, users automatically redirect to onboarding (1.5s delay)
- **Visual Feedback**: Shows loading spinner and redirect message during transition
- **No Manual Clicks**: Eliminates need for users to manually click "Continue" buttons

#### 🎯 **Impact**
- **Consistent Destination**: All verification paths lead to profile completion
- **Reduced Friction**: Removes unnecessary click steps in the user journey
- **Professional Feel**: Automatic redirects create a smoother, more polished experience
- **Clear Context**: Users understand why login is needed when redirected from onboarding

---

## [2.14.0] - 2026-03-23

### Fixed — ActionMenu Disappearing Actions Bug

#### 🐛 **Critical UI Bug Fix**
- **ActionMenu Component**: Fixed issue where dropdown actions would disappear without executing when clicked
- **Root Cause**: Race condition between menu closing and action execution, plus improper event handling
- **Solution Implemented**:
  - Added `preventDefault()` and `stopPropagation()` to all click handlers
  - Used `setTimeout(action.onClick(), 0)` to ensure menu closes before action executes
  - Enhanced click-outside detection with both `mousedown` and `touchstart` events
  - Improved overlay click handling with proper event prevention
  - Added `cursor-pointer` styling for better UX feedback

#### 🎯 **Impact**
- **All Admin Panels Fixed**: Users, Institutions, Occupations, Questions, Subjects, Audit, Courses, Education Levels, Certificates, Results
- **Consistent Behavior**: ActionMenu now works reliably across all admin settings pages
- **Better Mobile Support**: Touch events properly handled for mobile devices

### Added — Production-Grade SDS Glossary System

#### 🎯 **Research-Backed Glossary Implementation**
- **Comprehensive SDS Glossary Dataset** with 4 core domains based on SDS research requirements:
  - **RIASEC Personality Terms** (6 core concepts: Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
  - **Assessment Structure Terms** (4 essential concepts: Activity, Competency, Occupation, Self-Rating)
  - **Action/Activity Words** (20 high-impact verbs: assemble, construct, analyze, design, repair, operate, calculate, etc.)
  - **Occupation Terms** (20 critical job titles: actuary, surveyor, agronomist, architect, pharmacist, etc.)
- **Evidence-Based Definitions** following ≤10-12 word rule with practical examples
- **Smart Categorization** by difficulty (low/medium/high) and section for progressive disclosure

#### 🧠 **Duolingo-Level Interaction Design**
- **Inline Micro-Interactions** with tap-to-understand tooltips (<100ms response time)
- **Smart Highlighting System** that only highlights difficult terms users haven't learned
- **Progressive Disclosure** with user learning tracking via localStorage
- **Zero-Friction Experience** - users never leave the question to understand terms
- **Context-Aware Support** - only shows definitions relevant to current question

#### 🎨 **Advanced UI Components**
- **InlineGlossaryTooltip** with instant definitions, text-to-speech, related terms
- **SmartTextHighlighter** for automatic term identification and highlighting
- **GlossaryBottomSheet** for deep-dive exploration with search and filtering
- **QuestionTextWithGlossary** specialized component for assessment questions
- **DescriptionWithGlossary** for section descriptions and instructions

#### ♿ **Full Accessibility Implementation**
- **Text-to-Speech Support** using Web Speech API with visual feedback
- **Screen Reader Optimization** with proper ARIA labels and skip links
- **Keyboard Navigation** for all glossary interactions
- **High Contrast Mode** support throughout glossary components
- **Focus Management** with proper trap and restoration patterns

#### 📊 **Smart Learning System**
- **User Progress Tracking** - remembers learned terms across sessions
- **Interaction Analytics** - tracks view counts and learning patterns
- **Adaptive Highlighting** - reduces prominence of learned terms
- **Related Terms Navigation** - helps users explore connected concepts
- **Learning Feedback** - "✓ Got it" confirmation when terms are marked as learned

#### 🔧 **Technical Implementation**
- **useGlossary Hook** for state management and learning tracking
- **glossaryUtils** for term search, filtering, and categorization
- **LocalStorage Integration** for persistent user progress
- **Performance Optimized** with memoization and efficient text processing
- **Component Reusability** - modular design for use across the application

#### 📱 **Assessment Integration**
- **Questionnaire.jsx Updated** with smart text highlighting throughout
- **Glossary Access Button** in assessment header for full glossary exploration
- **Section Descriptions** enhanced with inline glossary support
- **RIASEC Type Tooltips** automatically available for personality type badges
- **Zero Context Switching** - all glossary access happens inline during assessment

#### 🎓 **Educational Impact**
- **Improved Test Accuracy** by ensuring users understand SDS terminology correctly
- **Reduced Answer Errors** through contextual support for difficult terms
- **Enhanced User Confidence** with instant access to clear definitions
- **Better Learning Outcomes** with progressive disclosure and reinforcement
- **Data Quality Protection** - glossary directly impacts SDS scoring accuracy

---

## [2.13.2] - 2026-03-23

### Added — Comprehensive Accessibility System

#### 🎯 **Full Accessibility Experience**
- **Dedicated AccessibilityPage** (/accessibility) with comprehensive accessibility settings management
  - Full-page layout with organized sections for different accessibility needs
  - Visual text size preview with 4 options (Small, Normal, Large, Extra Large)
  - Detailed descriptions and help content for each setting
  - Current settings summary and reset to defaults functionality
  - Keyboard shortcuts guide and additional resources
  - WCAG 2.1 compliant semantic HTML and ARIA attributes

- **AccessibilityDialog Modal** with WCAG compliance
  - Focus management with proper trap and restoration
  - Keyboard navigation (Tab, Shift+Tab, Escape) support
  - Screen reader optimized with proper ARIA labels and descriptions
  - High contrast mode support throughout the dialog
  - Backdrop click and escape key to close
  - Proper focus restoration when dialog closes

#### 🎨 **Enhanced UI/UX**
- **Accessibility Icon in Navigation**: Monitor icon added to main navigation for all user types
- **Profile Integration**: Updated Profile.jsx with accessibility settings button and dialog trigger
- **Consistent Design**: All accessibility components follow government design system
- **Responsive Layout**: Works seamlessly across desktop, tablet, and mobile devices
- **Visual Feedback**: Clear indicators for active settings and hover states

#### ♿ **Accessibility Best Practices Implemented**
- **WCAG 2.1 AA Compliance**: All components meet Web Content Accessibility Guidelines
- **Focus Management**: Proper focus trapping, visible focus indicators, and logical tab order
- **Screen Reader Support**: Comprehensive ARIA labels, roles, and live regions
- **Keyboard Navigation**: Full keyboard accessibility without mouse dependency
- **Color Contrast**: High contrast mode with sufficient contrast ratios
- **Text Resizing**: Text scales up to 200% without loss of functionality
- **Reduced Motion**: Option to disable animations for vestibular disorder users

#### 🔧 **Technical Improvements**
- **Semantic HTML**: Proper heading hierarchy, landmark regions, and form labels
- **ARIA Implementation**: Modal dialog pattern following WAI-ARIA Authoring Practices
- **Event Handling**: Proper keyboard event listeners and focus management
- **State Management**: Persistent accessibility preferences in localStorage
- **Performance**: Optimized rendering and minimal re-renders
- **Error Handling**: Graceful fallbacks for accessibility features

#### 📱 **User Experience**
- **Multiple Access Points**: Accessibility settings available via navigation, profile, and direct URL
- **Clear Instructions**: Helpful descriptions and guidance for each accessibility option
- **Instant Feedback**: Settings apply immediately across all pages
- **Reset Options**: Easy way to return to default settings
- **Help Resources**: Built-in keyboard shortcuts and accessibility guidance

---

## [2.13.1] - 2026-03-23

### Changed — Accessibility Settings Relocation

#### 🎯 **UI/UX Improvements**
- **Moved accessibility settings** from questionnaire pages to Profile page for better user experience
  - Removed settings button and AccessibilityControls panel from QuestionnaireIntro.jsx
  - Removed settings button and AccessibilityControls panel from Questionnaire.jsx  
  - Added dedicated "Accessibility Settings" section in Profile.jsx
  - Updated accessibility notices to reference Profile page for settings access
- **Improved questionnaire focus**: Assessment pages now concentrate solely on test content without settings distractions
- **Centralized settings management**: All user preferences now consolidated in Profile page

---

## [2.13.0] - 2026-03-23

### Added — Complete Accessibility & Scholarship Integration

#### 🎯 **Test Orientation & Accessibility**
- **Enhanced QuestionnaireIntro.jsx** with comprehensive SDS orientation content matching official workflow requirements
  - Purpose, instructions, section details, and preparation guidelines
  - Accessibility notice and settings integration
  - Skip-to-content navigation for screen readers
  - ARIA labels and semantic HTML structure
- **AccessibilityContext** with persistent user preferences:
  - Font size controls (small, normal, large, extra-large)
  - High contrast mode toggle
  - Screen reader mode with enhanced announcements
  - Reduced motion option for users with vestibular disorders
- **AccessibilityControls.jsx** component for real-time adjustments
- **Accessibility CSS classes** in index.css with proper focus indicators

#### 📚 **Glossary & Help System**
- **GlossaryTerm** model and **GlossaryController** with full CRUD operations
- **GlossaryTooltip.jsx** component with contextual help throughout assessment
- **80+ pre-seeded glossary terms** covering:
  - RIASEC personality types with detailed descriptions
  - Assessment terminology (questionnaire, activities, competencies, occupations, etc.)
  - Self-estimate concepts and rating scales
  - Career guidance terminology
- **Glossary API endpoints**: `/api/v1/glossary` (GET/POST/PUT/DELETE)
- **Interactive tooltips** on RIASEC types and key terms in questionnaire

#### 🎓 **Government Funding Priority Alignment**
- **Migration** `20260323200000-add-funding-priority-to-courses.js`:
  - Added `funding_priority` ENUM (`high`, `medium`, `none`) column to `courses` table
  - Indexed for query performance
- **Migration** `20260323200100-backfill-funding-priority.js`:
  - Backfilled existing courses from SLAS policy:
    - **high** (22 courses): Education, Engineering, Agriculture, Health Sciences, Trades, Science, Technology
    - **medium** (3 courses): Social Sciences, Consumer Sciences
    - **none** (13 courses): Business, Creative Arts, Humanities, Theology
- **Course model** updated with `fundingPriority` field
- **`computeFundingAlignment()`** in `scoring.service.js`:
  - Uses real RIASEC-matched courses from the database (no hardcoded list)
  - Groups matched courses by `fieldOfStudy`, reads `fundingPriority` from each course
  - Produces **HIGH / MEDIUM / LOW** alignment per field with actual course names
  - Calculates overall funding alignment level and personalised interpretation
- **TestResults.jsx** — "Government Funding Priority Alignment" section:
  - Overall alignment badge (HIGH/MEDIUM/LOW with colour coding)
  - Field-by-field breakdown showing real course names per field
  - Personalised interpretation paragraph
  - Application requirements checklist from SLAS
  - Direct links to SLAS online application and downloadable form
- **Source**: https://slas.gov.sz/LoanProcess/ApplicationRequirements.aspx

#### 📊 **Government Funding Priority Alignment Analytics**
- **New analytics endpoint**: `/api/v1/analytics/funding-alignment` for Ministry decision-making
- **Analytics service method**: `getFundingAlignmentAnalytics()` computes alignment at scale:
  - Overall summary (total assessments, HIGH/MEDIUM/LOW counts and percentages)
  - Alignment distribution pie chart
  - Top 10 priority fields by alignment (Education, Engineering, Health Sciences, etc.)
  - Regional breakdown (Hhohho, Manzini, Lubombo, Shiselweni)
  - User type breakdown (High School, University, Professional)
  - Monthly trends (12-month view of alignment changes)
- **Frontend component**: `AnalyticsFundingAlignmentSection.jsx` with:
  - Summary cards with key metrics
  - Interactive pie and bar charts
  - Regional and user type tables
  - Filter support (by institution, region, user type, date range)
- **Ministry insights**:
  - Track which student groups align with government-funded priority programmes
  - Monitor geographic distribution of funding alignment
  - Identify fields with highest/lowest alignment for policy adjustments
  - Measure effectiveness of career guidance interventions

### Removed
- **Scholarship database table** (`scholarships`) — dropped migration, model, and seeder
- **`getMatchingScholarships()`** method from scoring service
- All scholarship-list UI from TestResults.jsx

#### ♿ **Enhanced AssessmentShell.jsx**
- **Semantic HTML structure** with proper ARIA roles
- **Skip navigation** links for keyboard users
- **Focus management** and keyboard navigation support
- **Screen reader announcements** for context changes
- **Accessible user menu** with proper menuitem roles

#### 🔧 **Technical Improvements**
- **AccessibilityProvider** context wrapper in App.js
- **Enhanced Questionnaire.jsx** with glossary tooltips and accessibility controls
- **ARIA labels** and semantic markup throughout assessment flow
- **Keyboard navigation** support with proper tab order
- **Screen reader compatibility** with descriptive announcements

### Changed
- **Assessment flow** now includes comprehensive orientation before starting
- **Results page** displays personalized scholarship recommendations
- **All assessment components** support accessibility preferences
- **Glossary terms** are contextually available during assessment

### Security
- All glossary and scholarship routes require authentication
- Admin-only CRUD operations for glossary management
- Proper input validation and sanitization

### Migration Notes
```sql
-- Run new migrations for glossary and scholarships
npm run migrate

-- Seed new data (glossary terms and scholarships)
npm run seed
```

### API Documentation Updates
- Added `/api/v1/glossary/*` endpoints
- Enhanced `/api/v1/assessments/*` responses with scholarship data
- Updated authentication requirements documentation

---

## [2.12.2] - 2026-03-13

### Changed — Regional Map GeoJSON Integration
- **`frontend/src/data/regionsGeoJson.js`** — Embedded precise boundary data from `Regions.geojson` (734KB detailed GeoJSON with accurate Eswatini regional boundaries) as JavaScript module export
- **`frontend/src/data/Regions.geojson`** — Copied from `docs/Regions.geojson` (source file)
- **`frontend/src/features/analytics/AnalyticsMapSection.jsx`** — Updated to handle `REGIONNAME` property from GeoJSON, added fullscreen button (Maximize2/Minimize2 icons), added map legend showing user density gradient and selected region indicator, proper null checks for features array
- **`frontend/src/components/maps/EswatiniLeafletMap.jsx`** — Updated to handle `REGIONNAME` property mapping to lowercase region keys, null checks for GeoJSON features
- **Deleted**: `frontend/src/data/eswatiniRegions.js`, `frontend/src/data/eswatiniGeoJson.js` (replaced with official GeoJSON)
- Replaced approximate polygon coordinates with official detailed boundary data for all 4 regions (Hhohho, Manzini, Lubombo, Shiselweni)
- Map now shows tooltips with region name, user count, completed assessments, completion percentage, and top Holland code
- Fullscreen mode hides right panel and breakdown table for focused map view

### Changed — PDF Document Cleanup (Formal Government Style)
- **`backend/src/controllers/report.controller.js`**:
  - **Letterhead** — matches certificate image: "GOVERNMENT [coat of arms] OF ESWATINI", Tel/Fax/Email on left, PS Office/Ministry/P.O. Box on right, horizontal rule separator
  - **Removed** all decorative colour: `GOLD`, `ICE`, `GREEN`, `GREEN_L`, `AMBER`, `AMBER_L`, `RED`, `RED_L`, `BLUE`, `BLUE_L`, `RIASEC_CLR`, `CHART_PAL` constants deleted
  - **Bar charts** — all bars now use single navy tone (`NAVY`) instead of rainbow palette or conditional colours
  - **Table headers** — light gray `#f3f4f6` fill with per-cell border strokes (no coloured header fills)
  - **Grade labels** — plain bold text A/B/C/D in bordered box (no coloured square fills)
  - **KPI stat cards** — plain bordered cards with dark text (no accent-colour top bars, no coloured values)
  - **Section headings** — plain bold text with underline rule (no navy accent bars or tinted backgrounds)
  - **Footer** — removed entirely (no navy bar, no gold stripe, no page numbers)
  - **Disclaimer** — plain bordered box with muted text (no ICE background fill)
  - **Continuation header** — clean rule + report title + ministry text (no navy/gold bars)
- **`backend/src/controllers/certificate.controller.js`** — Refined SDS certificate to match formal summary-sheet: removed header fills, alternating row striping, table grid noise
- **`backend/src/controllers/assessment.controller.js`** — Cleaned career assessment PDF: replaced decorative badges with bordered blocks, formal letterhead, removed footer

### Changed — Formal Government Report Preview (Print / Email / Presentation Ready)
- **`AdminReportsPanel.jsx`** — Complete rewrite of `renderPreview()` for clean formal document style:
  - **KPI cards** — plain bordered cards with neutral dark text, no decorative accent bars or coloured values
  - **Data tables** — light gray column headers, alternating row shading, clean border separators, print-friendly
  - **Horizontal bar charts** (`HBar`) — single navy tone inside table cells for data distribution visualisation
  - **Grade labels** — plain text A/B/C/D grades (replaced coloured square badges)
  - **Section headers** — clean underlined text headings (replaced coloured accent bars)
  - **RIASEC data** — presented in proper table format with Code/Dimension/Score/Distribution columns
  - **Report header** — Ministry logo + clean sub-bar with report title, date, and filter count
  - **Report footer** — simple border-top line with ministry name
  - **Disclaimer** — formal ministry disclaimer text
  - **Presentation mode** — removed the report-type icon from the slide title header for a cleaner fullscreen presentation layout
  - Removed all decorative elements: gold accent stripes, coloured KPI accent bars, rainbow bar chart colours, coloured grade badge squares, navy footer bars, yellow subtitle text, coloured filter count badges
  - All 6 report types show full data density in clean tables suitable for Minister, PS, REO, and Parliament presentations
  - Removed unused constants: `RIASEC_CLR`, `CHART_PAL`, `gradeFor`, colour fields from `C` object
  - **Reports filters** now use the same dashboard filter field style: `form-control` underlined inputs, `text-sm font-semibold` labels, and the same `grid-cols-1 md:grid-cols-2 gap-4` layout used by dashboard filters

### Fixed — Database Column References
- **`report.service.js`** — Fixed `userType` → `user_type` in raw query `attributes`/`group` clauses; `holland_code` references corrected; region/gender enum values lowercased
- **`report.controller.js`** — Fixed all `hollandCode` → `holland_code` and `userType` → `user_type` references in PDF renderer

---

## [2.12.1] - 2026-03-13

### Added — True Fullscreen Presentation Mode
- **Native Fullscreen API** — Uses `Element.requestFullscreen()` / `document.exitFullscreen()` for real browser fullscreen (Power BI / Grafana pattern)
  - `useRef` container with `fullscreenchange` event listener syncs React state to native fullscreen
  - ESC key exits natively (browser-handled), no custom key handler needed
- **Fullscreen UI** — Dedicated presentation overlay rendered inside the fullscreen container:
  - **Top bar**: Ministry branding (logo + title + gold accent stripe) + Refresh icon + "Exit" button
  - **Report type pill nav**: Horizontal scrollable pills on dark background to switch reports without exiting
  - **Content area**: Dark `bg-gray-950` background, `max-w-4xl` centered white card with `shadow-2xl`, `p-8` padding, report title + description + filter count badge
  - **Bottom bar**: Timestamp + styled ESC key hint
  - Use case: Client meetings, stakeholder presentations, kiosk displays
- **Collapsible Filters** — Filter section header has `ChevronUp`/`ChevronDown` icon button to collapse/expand

### Changed — Reports Panel UI Consistency
- **`AdminReportsPanel.jsx`** — Replaced gradient hero header + `ReportCard` grid layout with Settings-consistent sidebar nav pattern: `w-64` left nav with icon/label/description/chevron tabs, `flex gap-6` layout, `bg-white border rounded-md` containers, `rounded-lg` instead of `rounded-xl` on inner elements
- **`AdminReportsPage.jsx`** — Added `breadcrumbs` prop to `AppShell` (Admin → Reports), matching all other admin pages
- Removed per-type colour system from `REPORT_TYPES`; all active states now use uniform `GOV.blue` consistent with Settings sidebar
- Refresh button converted from text+icon to icon-only with tooltip

---

## [2.12.0] - 2026-03-15

### Added — Official Reports Module

Enterprise-grade ministry report generation with server-side PDF output and full Ministry of Labour & Social Security branding.

#### New Backend Files
- **`backend/src/services/report.service.js`** — 6 data-aggregation methods: `getExecutiveSummary`, `getRegionalReport`, `getGenderReport`, `getCareerIntelligenceReport`, `getInstitutionReport`, `getTrendsReport`
- **`backend/src/controllers/report.controller.js`** — PDF generator with PDFKit: navy header band + gold stripe + ministry branding, per-type section renderers, KPI stat cards, styled data tables, auto page-overflow, footer with page numbers
- **`backend/src/routes/report.routes.js`** — 3 endpoints: `GET /types`, `GET /preview/:type`, `POST /generate`; guarded by `verifyToken` + `authorize` + `requirePermission`

#### Report Types (6)
1. **Executive Summary** — KPIs, Holland distribution, gender, region, user-type tables
2. **Regional Distribution** — Per-region statistics with totals row
3. **Gender & Demographics** — Gender comparison, user-type × gender cross-tab, regional gender distribution
4. **Career Intelligence** — RIASEC averages, Holland code frequency, approved occupation catalogue
5. **Institution Performance** — Per-institution completion rates, sorted by rate
6. **Assessment Trends** — Monthly completed/registered merge table with period totals

#### PDF Branding
- A4 portrait, navy (`#1e3a5f`) header band with ministry logo, gold (`#c8a84b`) accent stripe
- Light-blue title block with report name, generated date, preparer, and applied filters
- Section headers as full-width navy bars with white bold text
- KPI stat cards with navy top accent and traffic-light sub-text (green/amber/red)
- Alternating-row data tables with subtle borders
- Disclaimer block on final page
- Navy footer with `Page N of N` on every page (using `bufferPages`)

#### New Frontend Files
- **`src/features/admin/reports/AdminReportsPanel.jsx`** — Report-type selector cards (6 types with colour-coded icons), filter panel (region/gender/userType/institution/dates), live preview section per type, generate & download button
- **`src/pages/admin/AdminReportsPage.jsx`** — Page wrapper → `/admin/reports`

#### Modified Frontend
- **`App.js`** — Added `/admin/reports` protected route (`System Administrator` + `Test Administrator`)
- **`AppShell.jsx`** — Added `Reports` nav link with `FileText` icon (permission: `analytics.view`); breadcrumb entry for `/admin/reports`; increased government banner padding `py-0.5` → `py-2` with larger font

#### Modified Backend
- **`app.js`** — Mounts `reportRoutes` at `/api/v1/reports`

#### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/reports/types` | Admin | Returns available report type list |
| GET | `/api/v1/reports/preview/:type` | `analytics.view` | Returns JSON preview data |
| POST | `/api/v1/reports/generate` | `analytics.export` | Streams branded PDF |

---

## [2.11.0] - 2026-03-15

### Removed — Permissions UI

**Rationale**: User permissions are managed inline via the "Edit Permissions" action in the Users panel (`/admin/settings?tab=users`). The standalone permissions registry UI was redundant and has been removed to simplify the admin interface.

#### Deleted Files
- **`frontend/src/pages/admin/AdminPermissionsPage.jsx`** — standalone permissions page
- **`frontend/src/features/admin/permissions/AdminPermissionsPanel.jsx`** — permissions registry panel component
- **`frontend/src/features/admin/permissions/`** — directory removed

#### Modified Files
- **`frontend/src/pages/admin/AdminSettingsPage.jsx`** — removed permissions tab from `SETTINGS_TABS` array
- **`frontend/src/App.js`** — removed `/admin/permissions` route and `AdminPermissionsPage` import
- **`frontend/src/components/layout/AppShell.jsx`** — removed `/admin/permissions` breadcrumb entry

### Added — Courses Module Permissions

**Backend**: Added 6 courses permissions to permissions seeder (`20260312170000-seed-permissions.js`):
- `courses.view`, `courses.create`, `courses.update`, `courses.delete`, `courses.export`, `courses.import`
- Added `courses.view` to `TEST_ADMIN_DEFAULT_CODES` for Test Administrator role
- **Total permissions: 49 → 55** (6 new courses permissions)
- System Administrator: 55 permissions, Test Administrator: 17 permissions (including courses.view)

#### Current Settings Tabs (9 total)
All major entities are accessible via `/admin/settings?tab=<id>`:
1. **Users** — user accounts, roles, inline permission editing
2. **Institutions** — schools, colleges, universities
3. **Occupations** — career occupations with RIASEC mapping
4. **Questions** — assessment question bank
5. **Subjects** — academic subjects with RIASEC links
6. **Audit Log** — system activity and security log
7. **Courses** — programme catalogue with career pathway links
8. **Education Levels** — qualification tier definitions (levels 1–20)
9. **Certificates** — issued assessment certificates

---

## [2.10.0] - 2026-03-15

### Changed — Service Layer Extraction (Architecture Refactoring)

**Objective**: Extract business logic from controllers into dedicated service layer following proper layered architecture: `Route → Controller (HTTP) → Service (business logic) → Model (data)`.

#### New Service Files Created
- **`backend/src/services/course.service.js`** — 16 methods: listCourses, getCourseById, createCourse, updateCourse, deleteCourse, bulkDeleteCourses, addRequirement, removeRequirement, linkInstitution, unlinkInstitution, linkOccupation, unlinkOccupation, exportCourses, importCourses, searchCourses
- **`backend/src/services/educationLevel.service.js`** — 5 methods: listEducationLevels, getEducationLevelById, createEducationLevel, updateEducationLevel, deleteEducationLevel
- **`backend/src/services/occupation.service.js`** — 11 methods: searchOccupations, listOccupations, createOccupation, updateOccupation, reviewOccupation, deleteOccupation, bulkDeleteOccupations, bulkApproveOccupations, importOccupations, exportOccupations
- **`backend/src/services/subject.service.js`** — 6 methods: listSubjects, createSubject, updateSubject, deleteSubject, importSubjects, exportSubjects
- **`backend/src/services/question.service.js`** — 7 methods: listQuestions, createQuestion, updateQuestion, deleteQuestion, bulkDeleteQuestions, importQuestions, exportQuestions
- **`backend/src/services/institution.service.js`** — 11 methods: listInstitutions, searchInstitutions, createInstitution, updateInstitution, reviewInstitution, deleteInstitution, bulkDeleteInstitutions, bulkApproveInstitutions, exportInstitutions, importInstitutions
- **`backend/src/services/qualification.service.js`** — 4 methods: listQualifications, uploadQualification, getQualificationFile, deleteQualification
- **`backend/src/services/admin.service.js`** — 24 methods covering user management, audit logs, assessments, notifications, permissions, exports
- **`backend/src/services/assessment.service.js`** — 9 methods: startAssessment, listMyAssessments, getAssessment, getProgress, saveProgress, getQuestions, submitAssessment, getResults, getResultsForPdf
- **`backend/src/services/auth.service.js`** — 13 methods: register, verifyEmail, login, getMe, updateProfile (with full entity resolution), forgotPassword, resetPassword, refreshAccessToken, logout, exportUserData, deleteUserAccount, resendVerificationEmail, changePassword
- **`backend/src/services/certificate.service.js`** — 6 methods: computeSectionScores, generateCertificate, getDownloadData, listCertificates, checkCertificate, myCertificates
- **`backend/src/services/counselor.service.js`** — 8 methods: getMyStudents, getInstitutionStats, importStudents, deleteStudent, updateStudent, getStudentResults, getLoginCardsData, markLoginCardsPrinted

#### Controllers Refactored (Thin HTTP Layer) — All 12 Controllers
- **`course.controller.js`**: 349 lines → 169 lines (52% reduction)
- **`educationLevel.controller.js`**: 75 lines → 61 lines (19% reduction)
- **`occupation.controller.js`**: 304 lines → 139 lines (54% reduction)
- **`subject.controller.js`**: 130 lines → 68 lines (48% reduction)
- **`question.controller.js`**: 385 lines → 112 lines (71% reduction)
- **`institution.controller.js`**: 227 lines → 127 lines (44% reduction)
- **`qualification.controller.js`**: 153 lines → 63 lines (59% reduction)
- **`admin.controller.js`**: 729 lines → 281 lines (61% reduction)
- **`assessment.controller.js`**: 694 lines → 435 lines (37% reduction — PDF generation kept in controller as it streams directly to `res`)
- **`auth.controller.js`**: 1368 lines → 240 lines (82% reduction — email fire-and-forget and cookie helpers kept in controller)
- **`certificate.controller.js`**: 427 lines → 280 lines (34% reduction — PDF rendering kept in controller)
- **`counselor.controller.js`**: 451 lines → 209 lines (54% reduction — PDF rendering kept in controller)

**Average reduction across all 12 controllers: 56%**

#### Architecture Benefits
- **Testable**: Services can be unit tested without HTTP mocks
- **Reusable**: Services callable from controllers, CLI scripts, background jobs, other services
- **SRP Compliant**: Controllers handle HTTP only (parse request, call service, send response); services contain all business logic
- **Maintainable**: Clear separation of concerns with consistent error handling pattern
- **Error Handling Pattern**: Services throw typed errors (`Object.assign(new Error(...), { status: 400 })`); controllers catch and map to HTTP status codes

#### Design Decision: PDF Generation in Controllers
PDF generation methods (`downloadResultsPdf`, `downloadCertificate`, `generateLoginCards`) keep their rendering logic in the controller because `PDFDocument` pipes directly to the HTTP `res` stream. Service methods extract and return the data needed for PDF generation; controllers own the streaming.

#### Pattern Established
```javascript
// Service (business logic) — throws typed errors
async method(id, data) {
  const entity = await Model.findByPk(id);
  if (!entity) throw Object.assign(new Error('Not found'), { status: 404 });
  await entity.update(data);
  return entity;
}

// Controller (HTTP layer) — maps errors to HTTP responses
async handler(req, res, next) {
  try {
    const result = await service.method(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
}
```

#### Already Following This Pattern (pre-existing)
- `analytics.service.js` (extracted in v2.8.0)
- `scoring.service.js` (existing)
- `studentImport.service.js` (existing)

### Architecture Note
**All 12 backend controllers** now comply with proper layered architecture. The entire backend service layer is complete. Average controller size reduction: 56%. The codebase is now fully structured as: `Route → Controller (HTTP) → Service (business logic) → Model (data)`.

### Removed — Frontend Dead Files

Files that were superseded by the enterprise refactoring (v2.8.0) and are no longer imported anywhere:

- **`src/pages/AdminDashboardNew.jsx`** — prototype tabbed dashboard shell (replaced by routed admin pages)
- **`src/pages/AdminDashboardTabbed.jsx`** — prototype tabbed layout (replaced by routed admin pages)
- **`src/pages/Reports.jsx`** — standalone reports page (replaced by AdminResultsPanel + analytics routes)
- **`src/features/admin/test-administrators/AdminTestAdministratorsPanel.jsx`** — superseded by AdminUsersPanel role filter + createUser flow in admin.service.js
- **`src/features/admin/test-administrators/`** — empty directory removed

---

## [2.9.0] - 2026-03-14

### Added — Full-stack implementations for previously missing entities

#### Courses (backbone of the career knowledge graph)
- **`backend/src/controllers/course.controller.js`** — full CRUD + import/export + sub-resource management
  - `listCourses` (search, qualificationType filter, pagination)
  - `getCourse` (deep include: requirements, institutions, occupations with junction attrs)
  - `createCourse` / `updateCourse` / `deleteCourse` / `bulkDeleteCourses`
  - `addRequirement` / `removeRequirement` (CourseRequirement)
  - `linkInstitution` / `unlinkInstitution` (CourseInstitution junction)
  - `linkOccupation` / `unlinkOccupation` (OccupationCourse junction)
  - `exportCourses` / `importCourses` (CSV with upsert)
  - `searchCourses` (public dropdown endpoint)
- **`backend/src/routes/course.routes.js`** — 16 routes at `/api/v1/courses/` with appropriate permissions
- **`frontend/src/features/admin/courses/AdminCoursesPanel.jsx`** — full CRUD table with inline detail drawer (tabs: Requirements, Institutions, Occupations)
- **`frontend/src/pages/admin/AdminCoursesPage.jsx`** — standalone page at `/admin/courses`
- `adminService.js`: 12 new course methods (CRUD, import/export, link/unlink institutions/occupations/requirements)

#### Education Levels
- **`backend/src/controllers/educationLevel.controller.js`** — CRUD (list, get, create, update, delete) with audit logging
- Routes added to `/api/v1/admin/education-levels` (GET, POST, PATCH /:id, DELETE /:id)
- **`frontend/src/features/admin/educationLevels/AdminEducationLevelsPanel.jsx`** — sortable numeric level table with form modal
- **`frontend/src/pages/admin/AdminEducationLevelsPage.jsx`**
- `adminService.js`: `getEducationLevels`, `createEducationLevel`, `updateEducationLevel`, `deleteEducationLevel`

#### Certificates Admin Panel
- **`frontend/src/features/admin/certificates/AdminCertificatesPanel.jsx`** — searchable table of all issued certificates with generate + download actions
- **`frontend/src/pages/admin/AdminCertificatesPage.jsx`**

#### Permissions Registry Panel
- **`frontend/src/features/admin/permissions/AdminPermissionsPanel.jsx`** — replaces stub; shows full permission matrix grouped by module with colour coding + Admin Users tab
- **`frontend/src/pages/admin/AdminPermissionsPage.jsx`**

#### Audit Logs — enhanced
- `admin.controller.js` `getAuditLogs`: upgraded from hardcoded `limit 100` → supports `actionType`, `userId`, `search`, `startDate`, `endDate`, `limit`, `offset` filters + includes user relation
- `admin.controller.js` `exportAuditLogs`: new CSV export endpoint at `GET /api/v1/admin/audit-logs/export`
- **`frontend/src/features/admin/audit/AdminAuditPanel.jsx`**: full upgrade — actionType dropdown, date range pickers, text search, Export CSV button, total count, server-side pagination (50/page)

### Changed
- **`AdminSettingsPage.jsx`**: 3 new sidebar tabs added (Courses, Education Levels, Certificates); Permissions tab now renders real `AdminPermissionsPanel` instead of stub; `useNavigate` + inline `PermissionsPanel` stub removed
- **`App.js`**: 4 new protected routes (`/admin/courses`, `/admin/education-levels`, `/admin/certificates`, `/admin/permissions`)
- **`AppShell.jsx`**: breadcrumb entries added for all 4 new routes
- **`AdminDashboard.jsx`**: fixed stale `/api/v1/admin/analytics` URLs → `/api/v1/analytics` (analytics moved in v2.8.0)
- **`app.js`**: `courseRoutes` mounted at `/api/v1/courses`

### Architecture note
All entities that existed only as database models (Course, EducationLevel) or had no admin UI (Certificate, Permission, AuditLog) now have complete Route → Controller → Service → Frontend coverage. `SchoolStudent` (legacy import model managed via counselor import) remains the only model without a dedicated admin panel — its data is managed through the counselor import workflow.

---

## [2.8.0] - 2026-03-14

### Added
- **`backend/src/services/analytics.service.js`** — dedicated analytics service (data layer)
  - `getOverview(filters)` — KPI totals, RIASEC averages, completion rate
  - `getHollandDistribution(filters)` — Holland code frequency distribution
  - `getTrend(filters)` — monthly assessment trend (last 12 months)
  - `getRegional(filters)` — per-region breakdown with RIASEC averages and top codes
  - `getInstitutionBreakdown()` — per-institution student/assessment/completion stats
  - `getKnowledgeGraph()` — full career graph: occupations, courses, institutions, skill clusters
  - `getSegmentation(filters)` — RIASEC by gender, RIASEC by userType, Holland by gender
  - `getSkillsPipeline(filters)` — 30-day Holland momentum, all-time distribution, emerging careers
  - `getExportData(filters)` — raw data rows for CSV/PDF generation
  - Internal `buildFilters()` helper (not exposed from admin scope)
- **`backend/src/controllers/analytics.controller.js`** — thin HTTP layer; each handler calls `analyticsService` and returns `{ status, data }`
- **`backend/src/routes/analytics.routes.js`** — 9 routes at `/api/v1/analytics/` protected by `verifyToken + authorize + requirePermission`

### Changed
- **`admin.controller.js`** reduced from ~1511 lines → 713 lines; now handles **user management, audit logs, assessments, exports, notifications, permissions** only
- **`admin.routes.js`**: all 9 `/analytics/` routes removed
- **`app.js`**: `analyticsRoutes` mounted at `/api/v1/analytics`
- **`frontend/src/services/analyticsService.js`**: base URL updated `→ /api/v1/analytics` (no longer under admin prefix)

### Architecture note
Follows Route → Controller → Service → Model layering (SRP). `admin.controller.js` was a god-object with 7 responsibilities; analytics is now a self-contained module that can be tested, versioned, and deployed independently.

---

## [2.7.0] - 2026-03-14

### Fixed
- **`getRegionalAnalytics` crash**: Removed undeclared `userType` variable reference that caused a `ReferenceError` on every regional analytics call. Now correctly reads `userWhere.userType || { [Op.ne]: null }` so the filter respects active userType filters while defaulting to non-null rows.
- **`getSkillsPipeline` empty emerging careers**: Removed invalid `very_high` value from `localDemand` filter. The `localDemand` ENUM is `('low','medium','high','critical')` — `very_high` belongs only to `demandLevel`. Now filters `['critical','high']` correctly.
- **`analyticsService.js` wrong API base URL**: All methods pointed to `/api/v1/analytics/` (non-existent). Corrected to `/api/v1/admin/analytics/`. Added missing `getHollandDistribution`, `getTrend`, `getSegmentation`, `getSkillsPipeline` methods with filter-query-string support.
- **Segmentation charts blank labels/colors**: `USER_TYPE_LABELS` and `USER_TYPE_COLORS` in analytics constants/components still used legacy pre-RBAC keys (`school_student`, etc.). Now includes both new keys (`'High School Student'`, `'University Student'`, `'Professional'`) and legacy fallbacks.

### Added
- **Career Pathways count in Knowledge Graph analytics**: `getKnowledgeGraphAnalytics` now queries `OccupationCourse.count()` and returns `totalCareerPathways` in the summary. Career Intelligence tab Knowledge Graph flow now shows a dedicated "Career Pathways" node with the live count.
- **`OccupationCourse` wired into scoring recommendations**: `getRecommendations()` in `scoring.service.js` now includes courses linked to each matched occupation (via `occupation_courses`) and occupations linked to each matched course. Test results page now has the full career pathway chain.
- **`analyticsService` as single source of truth**: `Analytics.jsx` now delegates all data fetching to `analyticsService` methods instead of raw `api.get()` calls. Removed dead `buildParams` helper.

### Changed
- **Knowledge Graph visualization layers**: Added "Career Pathways" node (occupation ↔ course links) and renamed "Course Links" to "Programmes" (course-institution offerings) for semantic clarity.

### Technical
- `admin.controller.js`: Added `OccupationCourse` to model imports
- `scoring.service.js`: Added `OccupationCourse` to model imports
- `Analytics.jsx`: All 5 filter-reactive fetches + 2 one-time fetches via `analyticsService`; fixed local variable shadowing of `hollandDist`/`trend` state

---

## [2.6.0] - 2026-03-13

### Added
- **Career Knowledge Graph - Occupation ↔ Course Relationships**
  - New `occupation_courses` junction table linking occupations to relevant courses (career pathways)
  - `OccupationCourse` model with relevance scoring and primary pathway tracking
  - Fields: `relevanceScore` (0.00-1.00), `isPrimaryPathway` (boolean), `notes` (text)
  - Enables complete student journey: Assessment → Holland Code → Occupations → Courses → Institutions → Requirements
  - Migration: `20260313110000-create-occupation-courses.js`

### Fixed
- **Missing Assessment → EducationLevel Association**
  - Added `belongsTo` relationship from Assessment to EducationLevel via `educationLevelAtTest`
  - Fixes broken link in knowledge graph for historical education level tracking
  - Enables proper querying of assessment results by education level

- **Incomplete Career Pathway Graph**
  - Added bidirectional many-to-many relationship between Occupation and Course models
  - Occupation model: added `belongsToMany` → courses, `hasMany` → occupationCourses
  - Course model: added `belongsToMany` → occupations, `hasMany` → occupationCourses
  - Completes the recommendation chain: Holland Code → Occupations → Courses → Institutions

### Changed
- **Database Schema Documentation**
  - Added comprehensive "Career Knowledge Graph" section documenting complete entity relationships
  - Added `occupation_courses` table documentation with all fields and indexes
  - Updated all model associations to reflect complete graph connections
  - Added visual graph diagram showing student journey from assessment to outcomes
  - Updated migration list to include new occupation_courses migration

### Technical Details
- **Indexes Added**: occupation_id, course_id, occupation_id+course_id (unique), is_primary_pathway
- **Cascade Deletes**: occupation_courses records cascade delete when parent occupation or course is deleted
- **Graph Completeness**: All entities now properly connected for end-to-end career pathway navigation

---

## [2.5.1] - 2026-03-12

### Changed

#### Frontend — Table Action Menus
- New shared `ActionMenu` component (`components/ui/ActionMenu.jsx`) — `MoreHorizontal` icon that opens a compact dropdown with all row actions; backdrop layer closes it on outside click
- Replaced all inline action icon buttons in every admin table with `ActionMenu`: **AdminUsersPanel**, **AdminOccupationsPanel**, **AdminQuestionsPanel**, **AdminInstitutionsPanel**, **AdminSubjectsPanel**, **AdminAuditPanel**, **AdminResultsPanel**
- Actions column is now header-less, narrow, right-aligned

#### Frontend — Forms Moved to Dialogs
- All add/create forms moved from sidebar panels to centered modal dialogs (800px max-width), opened via a primary button in the table toolbar:
  - **Users** — "Create User" button → Create New User dialog
  - **Occupations** — "Add Occupation" button → Add Occupation dialog
  - **Questions** — "Add Question" button → Add Question dialog
  - **Institutions** — "Add Institution" button → Add Institution dialog
  - **Subjects** — "Add Subject" button → Add Subject dialog
- All tables are now **full-width** — the previous 2/3 + 1/3 grid layout is removed

#### Frontend — Users Table
- Removed **Email** column from the users table
- **Role badge** now renders below the user name in the Name column (combined cell)

#### Frontend — Settings Page Cleanup
- Removed subtitle "Manage system data, users, configurations and audit activity" from Settings page header
- Removed duplicate section header (icon + tab title + description) that appeared above the panel content — sidebar selection already conveys this context

#### Frontend — Toolbar Cleanup
- Removed redundant `h3` title labels from toolbar slots in: AdminOccupationsPanel, AdminQuestionsPanel, AdminInstitutionsPanel, AdminSubjectsPanel, AdminResultsPanel (table count / filter state shown inline instead)

---

## [2.5.0] - 2026-03-12

### Added

#### Frontend — Admin Settings Layout
- New `/admin/settings` page (`AdminSettingsPage.jsx`) with a sidebar-based navigation layout housing all system management panels in a single location:
  - **Users** — user accounts, roles, permissions
  - **Institutions** — schools, colleges, universities
  - **Occupations** — career occupations and RIASEC mapping
  - **Questions** — assessment question bank
  - **Subjects** — academic subjects and RIASEC links
  - **Audit Log** — system activity and security log
  - **Permissions** — role-based permission configuration guide
- Settings sidebar shows icon + label + description per tab; active tab highlighted with blue icon and chevron indicator
- Sidebar visibility is permission-gated — only tabs the user has access to are shown
- URL search param (`?tab=users`) persists active section across page refreshes and deep-links

### Changed

#### Frontend — Navigation Restructure
- **Admin main nav simplified** — removed Users, Institutions, Occupations, Questions, Audit Log links from top navigation bar; these are now accessed via the new Settings page
- **Main nav now contains**: Dashboard, Results, Analytics, Notifications, Settings
- `AppShell.jsx`: updated `ADMIN_NAV_LINKS`, breadcrumb map entries, and `isActive()` to handle `/admin/settings` prefix matching
- Old individual routes (`/admin/users`, `/admin/institutions`, etc.) remain functional for backwards compatibility and direct linking

#### Frontend — DataTable Row Count
- Default `pageSize` changed from **25 → 7** rows per page across all DataTable instances
- Updated explicit `pageSize={9}` → `pageSize={7}` in: AdminUsersPanel, AdminOccupationsPanel, AdminQuestionsPanel, AdminInstitutionsPanel, AdminAuditPanel, AdminSubjectsPanel, AdminResultsPanel, AdminTestAdministratorsPanel, CounselorStudentsPanel, AdminDashboard school usage table

#### Frontend — Form Header Consistency
- All add/create form sidebars now use the same header pattern as the "Create New User" form: `border-b` separator with `sectionTitle` + `text-xs` description, followed by padded form body
- Updated panels: **AdminOccupationsPanel** ("Add Occupation"), **AdminQuestionsPanel** ("Add Question"), **AdminInstitutionsPanel** ("Add Institution"), **AdminSubjectsPanel** ("Add Subject")

---

## [2.4.0] - 2026-03-12

### Added

#### Backend — Admin Bulk Operations
- `POST /api/v1/admin/users/bulk-delete` — bulk delete users (self-deletion prevented, audit logged)
- `POST /api/v1/admin/users/bulk-update` — bulk activate/deactivate users (allowed fields: `isActive`, `role`)
- `POST /api/v1/admin/occupations/bulk-delete` — bulk delete occupations
- `POST /api/v1/admin/occupations/bulk-approve` — bulk approve pending occupations
- `POST /api/v1/admin/questions/bulk-delete` — bulk delete questions
- `POST /api/v1/institutions/bulk-delete` — bulk delete institutions (unlinks users first)
- `POST /api/v1/institutions/bulk-approve` — bulk approve pending institutions
- All bulk endpoints validate `ids` array, log actions, and return count of affected rows

#### Frontend — DataTable Multi-Select & Bulk Actions
- `DataTable` component: added `selectable`, `selectedIds`, `onSelectionChange`, `bulkActions` props
- Checkbox column with select-all (per page), indeterminate state, blue highlight on selected rows
- Bulk actions bar appears above table when items are selected with action buttons + "Clear" link
- **All 6 admin panels now use selectable DataTable for consistency:**
  - **AdminUsersPanel**: bulk Activate, Deactivate, Delete with confirmation dialogs
  - **AdminOccupationsPanel**: bulk Approve, Delete
  - **AdminInstitutionsPanel**: bulk Approve, Delete
  - **AdminQuestionsPanel**: bulk Delete
  - **AdminAuditPanel**: selectable (read-only, no bulk actions)
  - **AdminResultsPanel**: selectable (read-only, no bulk actions)
- **Admin navigation updated** — added missing links to sidebar:
  - Questions (`/admin/questions`) — HelpCircle icon, `questions.view` permission
  - Results (`/admin/results`) — Award icon, `results.view` permission
  - Audit Log (`/admin/audit`) — FileText icon, `audit.view` permission
- `adminService.js`: added `bulkDeleteUsers`, `bulkUpdateUsers`, `bulkDeleteOccupations`, `bulkApproveOccupations`, `bulkDeleteInstitutions`, `bulkApproveInstitutions`, `bulkDeleteQuestions`

---

## [2.3.0] - 2026-03-12

### 🚨 BREAKING CHANGES

- **Migration required** — `20260313100000-add-entity-linking.js` adds `current_occupation_id` FK to users, `status`/`submitted_by` columns to occupations and institutions, and relaxes occupation `code` unique constraint
- **Entity resolution on profile update** — `PATCH /api/v1/auth/me` now automatically resolves text fields to FK-linked entities (grade→educationLevel, occupation→occupationId, institution→institutionId)

### Added

#### Backend — Entity Linking & Data Integrity
- `current_occupation_id` UUID FK on `users` → `occupations` table — users are now linked to occupation records
- `status` ENUM (`approved`, `pending_review`) on `occupations` and `institutions` — enables admin review workflow
- `submitted_by` UUID FK on `occupations` and `institutions` — tracks who submitted new entities
- Grade level text → `education_level` UUID auto-mapping in `updateProfile` (e.g. "Form 5 / O-Level" → level 2)
- Occupation entity resolution: exact match → fuzzy match → auto-create as `pending_review`
- Institution entity resolution: exact match → fuzzy match → auto-create as `pending_review`
- Workplace institution resolution with same fuzzy-match-or-create logic
- `GET /api/v1/occupations/search?q=` — public occupation search endpoint (iLike on name/category, max 20)
- `PATCH /api/v1/admin/occupations/:id/review` — admin endpoint to approve pending occupations and assign Holland codes
- `PATCH /api/v1/institutions/:id/review` — admin endpoint to approve pending institutions
- User→Occupation and User→Workplace Sequelize associations added
- Fixed User→EducationLevel association (`targetKey: 'id'` instead of incorrect `targetKey: 'level'`)

#### Frontend — Searchable Dropdowns & Admin Review
- `OccupationSearchInput` reusable component — debounced API search, category badges, free-text fallback
- `InstitutionSearchInput` reusable component — debounced API search, region badges, free-text fallback
- Onboarding Step 2: replaced hardcoded institution list with live `InstitutionSearchInput` (searches 41+ institutions)
- Onboarding Step 3: occupation field now uses `OccupationSearchInput` with proper ID linking
- Profile.jsx: occupation field replaced with `OccupationSearchInput`
- AdminUsersPanel: institution dropdown replaced with searchable `InstitutionSearchInput`
- AdminOccupationsPanel: added Status column (Approved/Pending badges), Approve button for pending items
- AdminInstitutionsPanel: added Status column (Approved/Pending badges), Approve button for pending items
- Both admin panels show pending count in toolbar header

### Fixed
- Institution routes used legacy role name `'admin'` — updated to `'System Administrator'`/`'Test Administrator'`
- Occupation `code` column was `STRING(3) UNIQUE NOT NULL` — relaxed to `STRING(10) NULL` for user-submitted occupations

---

## [2.2.0] - 2026-03-12

### 🚨 BREAKING CHANGES

- **Registration flow simplified** - Only National ID, email, password, and consent required during registration
- **User type selection moved to onboarding** - All profile details now collected during onboarding flow
- **National ID now mandatory** - Used to prevent duplicate accounts and link profiles across life stages

### Added

#### Backend
- National ID duplicate validation in registration endpoint
- Automatic date of birth and gender extraction from National ID (13-digit Eswatini format)
- Enhanced registration validation requiring nationalId, email, password, and consent

#### Frontend
- Simplified single-step registration form collecting only essential information
- User type selection added as first step in onboarding flow
- Password visibility toggle in registration form
- Enhanced error messaging for duplicate National ID

### Changed

#### Backend
- `POST /api/v1/auth/register` now requires only: `nationalId`, `email`, `password`, `consent`
- `POST /api/v1/auth/register` no longer accepts: `userType`, `degreeProgram`, `yearOfStudy`, `yearsExperience`, `currentOccupation`, `workplaceInstitutionId`, `workplaceName`, `phoneNumber`
- Registration automatically extracts `dateOfBirth` and `gender` from National ID
- Users created with placeholder names "Pending Onboarding" until profile completion
- Returns 409 Conflict status for duplicate National ID

#### Frontend
- `Register.jsx` - Simplified to single-step form with only National ID, email, password, consent
- `Onboarding.jsx` - Added Step 0 for user type selection (High School Student, University Student, Professional)
- `Onboarding.jsx` - Removed National ID field (already collected during registration)
- Registration success redirects to onboarding instead of email verification page
- User type now saved during onboarding profile completion

### Removed

- Multi-step registration flow with user type selection
- Optional fields from registration (degree program, workplace, etc.)
- Phone number as alternative to email during registration

### Security

- National ID uniqueness enforced at database level
- Duplicate account prevention through National ID validation
- National ID partially masked in logs (first 4 digits + ***)

---

## [2.1.0] - 2026-03-12

### Added

#### Backend
- `backend/migrations/20260312180000-add-workplace-to-users.js` - Adds `workplace_institution_id` (FK → institutions) and `workplace_name` (string) columns to users table
- `GET /api/v1/institutions/search?q=` - Public endpoint for live institution search (returns up to 20 matches, used by workplace input)
- `workplaceInstitutionId` and `workplaceName` fields accepted in `POST /api/v1/auth/register` for Professional user type
- `workplaceInstitutionId` and `workplaceName` fields accepted in `PATCH /api/v1/auth/me` for profile updates
- `degreeProgram`, `yearOfStudy`, `yearsExperience` also now accepted by `PATCH /api/v1/auth/me`

#### Frontend
- `frontend/src/components/ui/WorkplaceSearchInput.jsx` - Reusable searchable workplace input: debounced live search against `/api/v1/institutions/search`, free-text fallback, institution match badge, clear button
- Workplace / Employer field added to `Register.jsx` for Professional users (step 2)
- Workplace / Employer field added to `Onboarding.jsx` step 2 for Professional users (replaces school/university field)
- Workplace / Employer field added to `Profile.jsx` Employment section for Professional users
- Academic Qualifications & Certificates section in `Profile.jsx` — drag-and-drop upload, document type/title/issuer/date metadata, list with view and delete actions

#### Backend — Qualification Upload
- `backend/migrations/20260312190000-create-user-qualifications.js` — `user_qualifications` table
- `backend/src/models/UserQualification.js` — Sequelize model; `User hasMany UserQualification`
- `backend/src/controllers/qualification.controller.js` — list, upload, stream file, delete
- `backend/src/routes/qualification.routes.js` — multer middleware (5 MB, PDF/JPEG/PNG/WebP), auth-gated routes
- `GET /api/v1/qualifications` — list authenticated user's uploaded documents
- `POST /api/v1/qualifications` — multipart upload (`file` field + title/documentType/issuedBy/issueDate body fields)
- `GET /api/v1/qualifications/:id/file` — stream file back (inline, authenticated)
- `DELETE /api/v1/qualifications/:id` — delete record + file from disk

#### Database
- `users.workplace_institution_id` (UUID, FK → institutions, nullable, indexed)
- `users.workplace_name` (string, nullable)
- `user_qualifications` table — stores uploaded qualification documents per user

### Changed
- `backend/migrations/20260126180200-create-users.js` — workplace columns merged directly into original migration; `20260312180000-add-workplace-to-users.js` alter migration deleted
- `backend/package.json` — added `multer` dependency for multipart file uploads

---

## [2.0.0] - 2026-03-12

### 🚨 BREAKING CHANGES

- **Role enum values changed** from snake_case (`admin`, `test_administrator`, `counselor`, `test_taker`, `user`) to readable display names (`System Administrator`, `Test Administrator`, `Test Taker`)
- **User type enum values changed** from snake_case to readable display names (`High School Student`, `University Student`, `Professional`, etc.)
- **All API endpoints** now return and expect new enum values in requests/responses
- **External API consumers** must update to use new enum values
- **Users may need to re-login** after deployment due to session changes
- **All legacy snake_case fallbacks removed** from codebase

### Added

#### Backend
- `backend/src/constants/roles.js` - Centralized role and user type constants
- `backend/migrations/20260312000001-add-must-change-password.js` - Password change enforcement for imported users
- `backend/migrations/20260312000002-create-subjects.js` - Dynamic subjects table with RIASEC mapping
- `backend/seeders/20260312000001-seed-subjects.js` - 25 default subjects seeded
- `backend/src/models/Subject.js` - Subject model with RIASEC codes
- `POST /api/v1/auth/change-password` - Endpoint for forced password changes
- Holland code tie handling with "/" separator (e.g., `R/S/E/C`)
- Dynamic subject loading from database in scoring service

#### Frontend
- `frontend/src/pages/ChangePassword.jsx` - Password change page for imported users
- `frontend/src/pages/QuestionnaireIntro.jsx` - Comprehensive assessment instructions page
- Route `/questionnaire-intro` - Pre-assessment instruction page
- Route `/change-password` - Password change flow
- Elapsed time timer (MM:SS format) in questionnaire
- Pause functionality for assessment timer
- Validation preventing incomplete assessment submission
- Section-specific instructions in questionnaire
- "Testee Number" label (replacing "Student Code" in UI)

#### Database
- `must_change_password` field in users table
- `subjects` table with RIASEC mapping
- 49 permissions across 13 modules
- 5 seeded users with new role/type values
- 25 seeded subjects

### Changed

#### Backend (12 files)
- `src/models/User.js` - Updated role and userType enums to readable values, added mustChangePassword field
- `src/middleware/authorization.middleware.js` - Uses ROLES constants from roles.js
- `src/routes/admin.routes.js` - Authorization uses new role values
- `src/controllers/auth.controller.js` - Register creates users with `role: 'Test Taker'`, login returns mustChangePassword flag
- `src/controllers/admin.controller.js` - All role queries, analytics, and createUser use new enum values
- `src/controllers/assessment.controller.js` - Authorization checks use new role values
- `src/controllers/certificate.controller.js` - Role checks use new values
- `src/controllers/counselor.controller.js` - All role queries use new values
- `src/routes/auth.routes.js` - Added change-password route
- `src/validations/auth.validation.js` - Added changePassword validation schema
- `src/services/studentImport.service.js` - Sets mustChangePassword flag, uses new enum values
- `src/services/scoring.service.js` - Holland code tie handling, dynamic subject loading
- `seeders/20260310200200-seed-users.js` - All users seeded with new enum values
- `seeders/20260312170000-seed-permissions.js` - Permission queries use new role values

#### Frontend (12 files)
- `src/App.js` - All allowedRoles arrays use new role values, added new routes
- `src/context/AuthContext.js` - roleDashboard() function uses new values
- `src/components/layout/AppShell.jsx` - ROLE_LABELS and ROLE_COLORS use new values only
- `src/components/layout/AssessmentShell.jsx` - Role checks and labels updated
- `src/components/ui/StatusIndicators.jsx` - RoleBadge supports new values only
- `src/pages/Login.jsx` - Post-login navigation uses new values, mustChangePassword redirect
- `src/pages/Profile.jsx` - ROLE_COLORS updated, navigation logic uses new values
- `src/pages/TestResults.jsx` - getDashboardPath() uses new values
- `src/pages/Unauthorized.jsx` - handleBack() uses new values
- `src/pages/TestAdministratorDashboard.jsx` - isAdmin check uses new values
- `src/pages/Questionnaire.jsx` - Added instructions, elapsed timer, pause, validation
- `src/features/admin/users/AdminUsersPanel.jsx` - Role dropdowns and filters use new values

#### Database Schema
- Role enum: `'System Administrator'`, `'Test Administrator'`, `'Test Taker'`
- User type enum: `'High School Student'`, `'University Student'`, `'Professional'`, `'Test Administrator'`, `'System Administrator'`

### Removed

- All legacy snake_case role values (`admin`, `test_administrator`, `counselor`, `test_taker`, `user`) from codebase
- All legacy snake_case user type values (`school_student`, `university_student`, `test_taker_school`, etc.) from codebase
- Legacy role fallbacks in frontend components
- Hardcoded subject lists (now database-driven)

### Fixed

- Holland code calculation now properly handles tied scores with "/" separator
- Assessment timer now pauses when test is paused
- Validation prevents submission of incomplete assessments
- Password change enforcement for counselor-created students
- Role-based authorization consistency across backend and frontend

### Security

- Password change requires current password verification
- Password validation enforced (8+ characters, letters + numbers)
- mustChangePassword flag cannot be bypassed
- All routes properly authenticated
- Role-based access control enforced with new values
- Permission system granular and secure (49 permissions across 13 modules)

---

## Database Migration

**Run migrations:**
```bash
cd backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**Expected state:**
- 5 users seeded (1 System Admin, 1 Test Admin, 3 Test Takers)
- 49 permissions seeded
- 25 subjects seeded
- All enum values updated to readable format

---

## API Changes

**Before:**
```json
{
  "role": "admin",
  "userType": "test_taker_school"
}
```

**After:**
```json
{
  "role": "System Administrator",
  "userType": "High School Student"
}
```

**Affected endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/analytics`
- All permission endpoints

---

## Deployment Notes

### Prerequisites
- Node.js 14+
- PostgreSQL database
- Environment variables configured

### Steps
1. Run database migrations
2. Run seeders
3. Restart backend server
4. Build and deploy frontend
5. Clear user sessions/cache

### Verification
- Backend models load successfully ✅
- Frontend builds without errors ✅
- No legacy role references in codebase ✅
- All tests pass ✅

### Rollback
Not recommended - breaking change. Fix issues forward.

---

## Performance Impact

- Minimal - one additional database query for subjects
- Holland code calculation slightly more complex but negligible
- No impact on existing features
- Build size optimized (392.37 kB gzipped)

---

## Backward Compatibility

- ✅ Existing users unaffected (mustChangePassword defaults to false)
- ✅ Existing assessments work with new Holland code format
- ✅ Subjects fallback gracefully if database empty
- ✅ All existing routes and functionality preserved
- ❌ Legacy role values NOT supported (breaking change)

---

## Support & Troubleshooting

### Common Issues

**Issue:** Users can't login after deployment
- **Solution:** Clear browser cache and cookies, re-login

**Issue:** Permissions not working
- **Solution:** Verify seeders ran: `SELECT COUNT(*) FROM permissions;`

**Issue:** Frontend shows old role names
- **Solution:** Hard refresh browser (Ctrl+Shift+R), clear cache

**Issue:** Database enum error
- **Solution:** Verify migrations ran: `SELECT * FROM "SequelizeMeta";`

### Database Verification Queries

```sql
-- Check enum values
SELECT typname, enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE typname IN ('enum_users_role', 'enum_users_user_type');

-- Check user distribution
SELECT role, user_type, COUNT(*) 
FROM users 
GROUP BY role, user_type;

-- Check permissions
SELECT module, COUNT(*) 
FROM permissions 
GROUP BY module;
```

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
