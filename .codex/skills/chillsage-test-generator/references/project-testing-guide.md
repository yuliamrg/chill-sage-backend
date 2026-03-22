# Chillsage Backend Testing Guide

## Repository Shape

- Runtime: Node.js with CommonJS modules.
- Server entrypoint: `index.js`.
- API root: `/api`.
- Routers live in `src/routes/*`.
- Controllers live in `src/controllers/*`.
- Sequelize models live in `src/models/*`.
- Auth helpers live in `src/auth/*`.

## Current Constraints

- The repo currently does not ship with a real test stack in `package.json`.
- The server starts listening from `index.js`, so direct HTTP integration tests may require a small refactor to expose `app`.
- The backend uses a real database connection through Sequelize.

## Recommended Testing Strategy

1. Add or maintain `jest` and `supertest`.
2. Make the Express app importable without opening a TCP port.
3. Create shared helpers for:
   - login by email or username
   - building Bearer auth headers
   - creating temporary fixtures when stable credentials are unavailable
   - cleanup of created rows
4. Prefer endpoint-level integration tests for:
   - login
   - auth boundary
   - role authorization
   - CRUD behavior on a representative resource
   - audit fields and payload filtering

## Recommended Assertions

- Status code
- `status` / `msg` contract when the endpoint uses the shared API response format
- Key payload fields
- Missing token => `401`
- Invalid or expired token => `401`
- Insufficient role => `403`
- Resource missing => `404`
- Audit fields such as `user_created_id` and `user_updated_id` originate from the authenticated user

## Existing Auth Facts

- `POST /api/users/login` is public.
- Other `/api/*` routes are protected by `requireAuth`.
- JWT is extracted from `Authorization: Bearer <token>`.
- Inactive users are rejected.
- Roles are stored by id and resolved to names before `requireRole` checks.

## Existing Manual Test Credentials Pattern

Check `.env` for:

- `TEST_LOGIN_PASSWORD`
- `TEST_ADMIN_USERNAME`
- `TEST_ADMIN_EMAIL`
- `TEST_PLANEADOR_USERNAME`
- `TEST_PLANEADOR_EMAIL`
- `TEST_TECNICO_USERNAME`
- `TEST_TECNICO_EMAIL`
- `TEST_SOLICITANTE_USERNAME`
- `TEST_SOLICITANTE_EMAIL`

Prefer these accounts for stable auth tests when present. If they are absent or stale, create temporary users and remove them after the test run.

## Common Requests That Fit This Skill

- Add login tests for `/api/users/login`
- Add authorization tests for one protected router
- Add full auth matrix tests for multiple roles
- Add regression tests for payload filtering or audit fields
- Bootstrap testing infra for this backend before adding endpoint tests
