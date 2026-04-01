# Remote DB Version Notes (`SDS-remote-db`)

This document describes what changed in the `SDS-remote-db` branch.

## Summary
- Deployment variant targeted at hosted environments using a managed PostgreSQL database.
- Frontend build scripts updated to avoid executable-bit issues for `react-scripts` in shared hosting build pipelines.
- Added production frontend env file for hosted deployment API URL configuration.

## Key Changes

### 1. Remote Database Deployment Pattern
- Backend now supports managed PostgreSQL deployment via `DATABASE_URL` with TLS query params.
- Setup documentation includes an explicit managed DB configuration section.
- Runtime note added to ensure `FRONTEND_URL` is set to the live site domain in hosting env vars.

### 2. Frontend Build Script Compatibility
- `frontend/package.json` scripts were changed from:
  - `react-scripts <command>`
- to:
  - `node ./node_modules/react-scripts/bin/react-scripts.js <command>`
- This avoids failures where `.bin/react-scripts` is present but not executable.

### 3. Production Frontend API Configuration
- Added `frontend/.env.production` for hosted builds.
- `REACT_APP_API_URL` should point to the live API origin, for example:
  - `https://<your-domain>`

## Deployment Notes
- Keep secrets (database passwords, SMTP credentials, JWT secrets) in hosting environment variables.
- Do not commit production credentials to source control.
- Ensure `.htaccess` keeps `/api` and `/health` on backend routes while using SPA fallback for frontend routes.
