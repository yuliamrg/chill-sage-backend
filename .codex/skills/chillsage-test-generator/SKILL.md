---
name: chillsage-test-generator
description: Generate and maintain tests for the Chillsage backend. Use when Codex needs to add or update Jest/Supertest integration tests, auth/login tests, role authorization tests, CRUD endpoint tests, audit-field assertions, or test infrastructure for this Express + Sequelize API.
---

# Chillsage Test Generator

Generate tests that match the real backend structure instead of producing generic Express samples.

## Workflow

1. Inspect the target area first.
Read the route, controller, model, and any auth middleware involved before writing tests.

2. Prefer integration tests over isolated unit tests.
This codebase is organized around Express routes, controllers, Sequelize models, and shared auth middleware. Favor HTTP-level tests for endpoints unless the user explicitly asks for unit tests.

3. Detect whether the test stack already exists.
If `package.json` does not define a real test runner or the repo lacks `jest`, `supertest`, and a test bootstrap, add the minimum viable setup first.

4. Make the app testable before writing many tests.
If the server only calls `app.listen()` from `index.js`, refactor carefully so tests can import an Express app without binding a port. Prefer exporting `app` and the startup function, or moving app construction to `src/app.js`.

5. Reuse existing auth conventions.
The current API keeps `POST /api/users/login` public and protects the rest of `/api` with Bearer JWT auth. Load [references/role-matrix.md](./references/role-matrix.md) when generating auth and authorization tests.

6. Reuse stable test credentials when available.
Inspect `.env` for `TEST_*` credentials before creating temporary users. If stable users do not exist, create temporary fixtures and clean them up.

7. Assert behavior, not only status codes.
Verify response shape, denial reason, audit fields, and protected-field behavior. For this project, `401` and `403` distinctions matter and audit fields must come from `req.auth`, not from client payloads.

8. Run the tests you add.
Do not leave generated tests unexecuted if the environment allows it. If a required dependency or DB fixture blocks execution, say so explicitly.

## Project Guidance

- Read [references/project-testing-guide.md](./references/project-testing-guide.md) for the repository-specific testing strategy.
- Read [references/role-matrix.md](./references/role-matrix.md) when the request touches auth, roles, or protected routes.
- Keep changes minimal and local. Do not rewrite the whole app just to make testing possible.
- Prefer one shared test helper for login/token acquisition instead of duplicating auth code across files.
- If a test depends on database writes, either:
  - create data through the API and clean it up, or
  - create direct Sequelize fixtures only when the API path would make setup unreasonably noisy.

## Test Priorities

When the user asks for tests and does not specify the level, prioritize in this order:

1. Login flow:
`POST /api/users/login` success by email and username, missing credentials, wrong password, nonexistent user, inactive user.

2. Auth boundary:
Protected route without token => `401`; malformed/invalid/expired token => `401`.

3. Role authorization:
Allowed role succeeds; disallowed role returns `403`.

4. CRUD contract:
Happy path plus one representative validation or not-found path.

5. Security-sensitive behavior:
Audit fields come from authenticated user, not the request body; restricted payload fields are ignored or blocked.

## Output Conventions

- Prefer test files under a coherent tree such as `tests/integration/` and `tests/helpers/`.
- Name files after the resource and scope, such as `auth.login.test.js`, `requests.authorization.test.js`, or `users.audit.test.js`.
- Keep each test file focused on one concern.
- Add small helpers for login, auth headers, cleanup, and fixture creation when repetition appears twice.

## Practical Defaults

- Use `jest` as the default runner for this backend unless the repo already uses another framework.
- Use `supertest` for HTTP assertions.
- Use `beforeAll`/`afterAll` for suite-level setup and cleanup when touching the database.
- Avoid hard-coding port `3037` in tests; import the app directly whenever possible.
- If importing the app is impossible without refactor, make the smallest refactor that preserves runtime behavior.

## Example Prompts

- `Use $chillsage-test-generator at ./.codex/skills/chillsage-test-generator to add login tests for POST /api/users/login.`
- `Use $chillsage-test-generator at ./.codex/skills/chillsage-test-generator to add authorization tests for /api/requests by role.`
- `Use $chillsage-test-generator at ./.codex/skills/chillsage-test-generator to bootstrap Jest and Supertest for this backend, then add tests for users audit fields.`
