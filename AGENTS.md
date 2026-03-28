# AGENTS.md

## Working Agreements

- Prefer `pnpm` for dependency and script execution.
- Do not assume the product docs in `docs/context/` are already implemented.
- If a change affects API behavior, update `docs/contracts/FRONTEND_API_SERVICES.md` in the same change.
- If a change affects schema, add a migration under `src/models/database/migrations/`.
- Do not introduce bootstrap or schema mutations into `pnpm start`.

## Source Of Truth

- Repo entrypoint: [`README.md`](./README.md)
- Documentation map: [`docs/README.md`](./docs/README.md)
- Real HTTP contract: [`docs/contracts/FRONTEND_API_SERVICES.md`](./docs/contracts/FRONTEND_API_SERVICES.md)
- Canonical schema: [`docs/engineering/CANONICAL_SCHEMA.md`](./docs/engineering/CANONICAL_SCHEMA.md)
- Current gaps and risks: [`docs/engineering/REVIEW.md`](./docs/engineering/REVIEW.md)
- Product target: [`docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md`](./docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)

## Repo Map

```text
index.js
src/
  app.js
  auth/
  controllers/
  domain/
  models/
  observability/
  routes/
  security/
  utils/
scripts/
tests/
docs/
```

## Validation Commands

- `pnpm test`
- `pnpm run db:migrate`
- `pnpm run db:bootstrap-auth`

## Operational Notes

- `POST /api/users/login` and `GET /api/health` are public; the rest of `/api` requires Bearer auth.
- `requests`, `orders` and `schedules` use action endpoints for state transitions; do not treat `PUT` as a free-form state update.
- Browser clients depend on `CORS_ORIGINS`, login rate limiting and `X-Request-Id`; reflect contract changes in docs.
