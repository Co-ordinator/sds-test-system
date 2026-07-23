# Contributing to the SDS Test System

Thank you for improving the Self-Directed Search (SDS) Test System. This repository supports a ministry career-assessment service, so changes should be small, reviewable, tested, and safe for existing users and assessment records.

## Before You Change Code

1. Read `AGENTS.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`, and `TROUBLESHOOTING.md`.
2. Check `git status --short`. Do not overwrite, stage, or discard someone else's changes.
3. Read the affected route, controller, service, model, migration, and existing tests before editing.
4. Keep test-taker onboarding, scoring logic, roles, seed data, certificate assets, and security-sensitive settings unchanged unless the task explicitly requires a change.

## Local Setup

Use Node.js 18 or later and PostgreSQL. Install dependencies from the repository root:

```bash
npm install
```

Copy the example environment files and configure local or approved shared database access. Never commit `.env` files, credentials, tokens, database dumps, downloaded hosting logs, generated outputs, or private handoff files.

Start the application:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:5000/health`

## Database Migrations

Migrations must be additive, idempotent where practical, and safe for existing data. Do not use destructive resets on shared or production databases.

```bash
npm run migrate --prefix backend
npm run db:verify --prefix backend
```

When a model adds an optional database field, include and test its migration in the same change. Before deployment, apply migrations before starting the new backend code. This prevents schema/code mismatches such as an assessment endpoint selecting a column that is not yet available.

Do not run `npm run db:reset --prefix backend` against a shared or production database.

## Testing And Validation

Run checks that match your change:

```bash
# Backend JavaScript changes
node --check backend/src/path/to/file.js
npm test --prefix backend -- --runInBand tests/relevant.test.js
npm run build --prefix backend

# Frontend changes
npm test --prefix frontend
npm run build --prefix frontend
```

For schema or seed work, also run `npm run db:verify --prefix backend`. Record any check that could not be run and why.

## Documentation Expectations

Update documentation in the same pull request when behavior, operations, or deployment steps change:

- `PROJECT_CONTEXT.md` for current system state and important operational knowledge.
- `DECISIONS.md` for durable product or architecture decisions and trade-offs.
- `TROUBLESHOOTING.md` for a repeatable symptom, diagnosis, and recovery path.
- `docs/CHANGELOG.md` for user-impacting changes, migration requirements, and verification.
- `README.md` or `docs/SETUP_GUIDE.md` for setup and deployment workflow changes.

Use clear dates, describe the root cause for production fixes, and state any migration or manual deployment requirement.

## Pull Requests And Commits

- Work on a descriptive branch, for example `agent/assessment-schema-fix`.
- Keep commits focused and use a short imperative message, for example `Fix assessment start schema compatibility`.
- Stage explicit file paths; never use `git add -A` in a mixed worktree unless every change is confirmed in scope.
- Include the user impact, root cause, migration/deployment notes, and checks in the pull-request description.
- Open draft pull requests by default unless the reviewer asks for a ready-for-review pull request.

## Security And Privacy

- Never expose or commit database URLs, SMTP passwords, JWT secrets, refresh secrets, encryption keys, user passwords, national IDs, or production data.
- Do not alter access controls to bypass onboarding or role restrictions.
- Treat exports, uploaded qualification files, login cards, logs, database backups, and Hostinger environment handoff files as private operational data.
