# Chillsage Backend

Backend REST en `Express` + `Sequelize` para ChillSage.

El estado real del repo ya no es solo CRUD: hoy hay flujo operativo implementado para `requests`, `orders` y `schedules`, además de autenticación JWT, autorización por rol, cobertura multi-cliente, paginación, observabilidad básica y migraciones versionadas.

## Qué Existe Hoy

- API bajo `/api`
- login en `POST /api/users/login`
- `GET /api/health` público
- JWT Bearer y autorización por rol
- aislamiento por cliente con `primary_client_id`, `client_ids` y `all_clients`
- recursos base: `users`, `clients`, `roles`, `profiles`, `equipments`
- flujo operativo: `requests`, `orders`, `schedules`
- pruebas de integración con `jest` y `supertest`

## Requisitos

- Node.js 18+
- MySQL disponible
- dependencias instaladas con `pnpm install`

## Variables De Entorno

Variables principales:

- `PORT`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOSTNAME`, `DB_PORT`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `LOGIN_RATE_LIMIT_WINDOW_MS`, `LOGIN_RATE_LIMIT_MAX`
- credenciales `TEST_*` para bootstrap de usuarios de prueba

Referencia completa:

- [`.env.example`](./.env.example)

## Arranque Rápido

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:bootstrap-auth
pnpm start
```

## Scripts Útiles

- `pnpm start`: inicia la API
- `pnpm test`: ejecuta pruebas
- `pnpm run db:migrate`: aplica migraciones versionadas
- `pnpm run db:ensure-schema`: alias de compatibilidad de `db:migrate`
- `pnpm run db:bootstrap-auth`: asegura roles base y usuarios de prueba

## Estructura

```text
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
tests/
  helpers/
  integration/
docs/
```

## Documentación

Punto de entrada:

- [docs/README.md](./docs/README.md)

Fuentes canónicas:

- [Contrato API real](./docs/contracts/FRONTEND_API_SERVICES.md)
- [Esquema canónico](./docs/engineering/CANONICAL_SCHEMA.md)
- [Revisión técnica](./docs/engineering/REVIEW.md)
- [Plan de hardening](./docs/engineering/HARDENING_PLAN.md)
- [Contexto de producto](./docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
- [Especificación funcional](./docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)

## Notas Operativas

- `pnpm start` no modifica esquema ni crea datos base.
- Si hay conflicto entre documentación de producto y backend implementado, manda el contrato real en [docs/contracts/FRONTEND_API_SERVICES.md](./docs/contracts/FRONTEND_API_SERVICES.md).
- Si hay conflicto entre backlog o revisiones históricas y el código actual, manda `docs/contracts/` para contrato HTTP y `docs/engineering/CANONICAL_SCHEMA.md` para persistencia.
