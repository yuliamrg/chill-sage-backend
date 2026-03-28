# Chillsage Backend

Backend REST construido con `Express` y `Sequelize` para ChillSage.

El backend ya no es solo una base CRUD. Hoy implementa un flujo operativo real en `requests`, `orders` y `schedules`, mientras que el resto de recursos sigue siendo mayormente CRUD administrativo.

## Estado Real Del Proyecto

Lo que existe hoy:

- API REST bajo `/api`
- login con `email` o `username` y `password`
- autenticacion JWT Bearer
- autorizacion por rol
- auditoria base con `user_created_id` y `user_updated_id`
- contrato operativo real para `requests`, `orders` y `schedules`
- reglas finas de validacion y permisos en `equipments`
- filtros por query en modulos operativos
- pruebas de integracion con `jest` y `supertest`
- CORS restringido por entorno para clientes web
- rate limiting en `POST /api/users/login`
- respuestas `500` saneadas para no exponer detalles internos
- observabilidad minima con logs JSON, `X-Request-Id` y `GET /api/health`
- paginacion uniforme en listados con `page`, `limit`, `sort` y `meta`
- migraciones versionadas con `schema_migrations`

Lo que aun no existe o sigue incompleto:

- refresh token
- historial tecnico dedicado
- calificacion del servicio como recurso propio
- permisos finos por ownership fuera de los modulos operativos ya endurecidos

## Dominio Operativo Implementado

### Requests

`requests` representa la necesidad inicial de servicio.

- nace en `pending`
- puede aprobarse con `POST /api/requests/:id/approve`
- puede anularse con `POST /api/requests/:id/cancel`
- `solicitante` puede crear y consultar dentro de su alcance
- `planeador` y `admin` pueden revisar y decidir

### Orders

`orders` representa el trabajo tecnico ejecutable derivado de una solicitud aprobada.

- solo se crea desde una `request` en `approved`
- soporta `assign`, `start`, `complete` y `cancel`
- el tecnico asignado puede iniciar y completar su orden
- `DELETE` queda reservado a `admin`

### Schedules

`schedules` representa cronogramas de mantenimiento por cliente y equipos.

- exige `client_id`, `name`, `type`, `scheduled_date` y `equipment_ids`
- mantiene relacion muchos a muchos con equipos
- soporta `open` y `close`
- valida que todos los equipos pertenezcan al mismo cliente

## Stack

- Node.js
- Express 4
- Sequelize 6
- MySQL
- bcrypt 6
- jsonwebtoken
- Jest
- Supertest

## Estructura De Codigo

```text
index.js
src/
  app.js
  auth/
  controllers/
  models/
  routes/
  utils/
tests/
  helpers/
  integration/
docs/
  README.md
  CODEX_CONTEXT.md
  context/
  contracts/
  engineering/
  process/
```

Arquitectura actual:

- `src/app.js` construye Express, valida conexion a DB, valida configuracion JWT y monta `/api`
- `src/routes/` separa rutas por recurso
- `src/controllers/` concentra logica HTTP y reglas de negocio actuales
- `src/models/` define Sequelize y asociaciones
- `tests/integration/` valida contrato HTTP y flujos criticos

## Documentacion

Punto de entrada:

- [docs/README.md](./docs/README.md)

Orden recomendado:

1. [docs/CODEX_CONTEXT.md](./docs/CODEX_CONTEXT.md)
2. [docs/contracts/FRONTEND_API_SERVICES.md](./docs/contracts/FRONTEND_API_SERVICES.md)
3. [docs/engineering/CANONICAL_SCHEMA.md](./docs/engineering/CANONICAL_SCHEMA.md)
4. [docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md](./docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
5. [docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](./docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)
6. [docs/engineering/REVIEW.md](./docs/engineering/REVIEW.md)

## Requisitos

- Node.js 18+ recomendado
- MySQL disponible
- dependencias instaladas con `pnpm install` o `npm install`

## Variables De Entorno

- `PORT`: puerto HTTP del servidor. Default `3000`
- `DB_NAME`: nombre de la base de datos
- `DB_USER`: usuario de base de datos
- `DB_PASSWORD`: contrasena de base de datos
- `DB_HOSTNAME`: host de MySQL. Default `127.0.0.1`
- `DB_PORT`: puerto de MySQL. Default `3306`
- `DB_SYNC`: si vale `true`, `pnpm run db:migrate` ejecuta `db.sync({ force: false })` antes de correr migraciones versionadas. Debe usarse solo como apoyo de compatibilidad, no como mecanismo principal de evolucion del esquema
- `JWT_SECRET`: secreto para firmar tokens
- `JWT_EXPIRES_IN`: duracion del access token. Default `8h`
- `APP_NAME`: nombre logico del servicio para logs estructurados. Default `chillsage-backend`
- `CORS_ORIGINS`: lista separada por comas con los origins permitidos para navegador
  Incluye por defecto `http://localhost:4200` y `http://127.0.0.1:4200` para desarrollo con `ng serve`.
- `LOGIN_RATE_LIMIT_WINDOW_MS`: ventana del rate limit de login en milisegundos. Default `900000`
- `LOGIN_RATE_LIMIT_MAX`: maximo de intentos fallidos permitidos en la ventana. Default `5`
- `TEST_ADMIN_USERNAME`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`: credenciales del usuario de prueba `admin`
- `TEST_SOLICITANTE_USERNAME`, `TEST_SOLICITANTE_EMAIL`, `TEST_SOLICITANTE_PASSWORD`: credenciales del usuario de prueba `solicitante`
- `TEST_PLANEADOR_USERNAME`, `TEST_PLANEADOR_EMAIL`, `TEST_PLANEADOR_PASSWORD`: credenciales del usuario de prueba `planeador`
- `TEST_TECNICO_USERNAME`, `TEST_TECNICO_EMAIL`, `TEST_TECNICO_PASSWORD`: credenciales del usuario de prueba `tecnico`

Referencia:

- [`.env.example`](./.env.example)

## Instalacion

```bash
pnpm install
cp .env.example .env
pnpm start
```

Crea `.env` a partir de `.env.example` antes de iniciar.

## Arranque

Comportamiento actual:

- valida conexion con `db.authenticate()` antes de abrir el puerto HTTP
- inicializa asociaciones Sequelize
- valida que `JWT_SECRET` exista antes de aceptar trafico
- restringe CORS a los origins definidos en `CORS_ORIGINS`
- aplica rate limiting a `POST /api/users/login`
- agrega `X-Request-Id` a todas las respuestas
- emite logs estructurados JSON para requests, autenticacion y errores
- expone `GET /api/health` sin autenticacion para chequeo operativo
- monta la API bajo `/api`

`pnpm start` ya no modifica esquema ni crea datos base.

## Compatibilidad Con Frontend

Si el frontend consume este backend desde navegador, debe alinearse con estas reglas actuales:

- el origin del frontend debe estar incluido en `CORS_ORIGINS`
- login puede responder `429` cuando excede `LOGIN_RATE_LIMIT_MAX` dentro de `LOGIN_RATE_LIMIT_WINDOW_MS`
- el frontend no debe depender de mensajes internos en errores `500`; ahora recibe mensajes genericos
- cada respuesta incluye `X-Request-Id`; el frontend puede reenviarlo para correlacion
- la autenticacion sigue siendo por `Authorization: Bearer <access_token>`; no hay cookie de sesion ni refresh token

Cambio esperado en frontend:

- agregar manejo explicito de `429` en login y bloquear reintentos agresivos
- mostrar mensaje de infraestructura o reintento para `500` sin intentar parsear detalle tecnico
- conservar y reportar `X-Request-Id` cuando el usuario informe errores o fallos de integracion
- verificar que `VITE_API_URL` o equivalente apunte al backend y que su origin este permitido por `CORS_ORIGINS`
- si el frontend corre con `ng serve`, incluir `http://localhost:4200` y `http://127.0.0.1:4200` en `CORS_ORIGINS`
- para `equipments`, no reutilizar exactamente el mismo formulario editable entre `admin` y `planeador` sin bloqueo de campos
- para `clients`, no reutilizar exactamente el mismo formulario editable entre `admin` y `planeador` sin bloqueo de campos
- para `users`, no exponer altas, edicion ni `DELETE` a `planeador`; ese modulo ya es de solo lectura para ese rol
- ocultar `DELETE` de clientes para `planeador`
- limitar `status` de clientes a `active` e `inactive`
- validar `email` de clientes y, si aplica, `phone` antes de enviar
- manejar `409` al eliminar clientes como caso de relaciones activas, no como fallo inesperado
- ocultar `DELETE` de equipos para `planeador`
- limitar `status` de equipos a `active`, `inactive`, `maintenance`, `retired`
- validar que `use_end_at` no sea menor que `use_start_at`
- validar `username` de usuarios con patron `^[A-Za-z0-9._-]{3,50}$`
- validar `email` y `password` de usuarios antes de enviar; `password` requiere minimo 8 caracteres
- limitar `status` de usuarios a `active` e `inactive`
- manejar `409` al eliminar usuarios como caso esperado si es auto-eliminacion o si hay `requests`/`orders` asociados
- no enviar `user_created_id` ni `user_updated_id` esperando controlar auditoria

## Esquema Oficial

El esquema persistente oficial del backend usa nombres en ingles.

Tablas canonicas:

- `users`
- `roles`
- `profiles`
- `clients`
- `equipments`
- `requests`
- `orders`
- `schedules`
- `schedule_equipments`

Referencia:

- [docs/engineering/CANONICAL_SCHEMA.md](./docs/engineering/CANONICAL_SCHEMA.md)

## Bootstrap Manual

Cuando necesitas preparar base de datos o datos de autenticacion, usa scripts dedicados:

```bash
pnpm run db:migrate
pnpm run db:bootstrap-auth
```

Que hace cada uno:

- `db:migrate`: autentica DB, inicializa asociaciones, crea la tabla `schema_migrations` si no existe y aplica migraciones versionadas pendientes
- `db:ensure-schema`: alias temporal de `db:migrate` para no romper flujos viejos
- `db:bootstrap-auth`: autentica DB, asegura roles base y crea o actualiza usuarios de prueba por rol

Flujo recomendado para una base nueva:

1. configurar `.env`
2. correr `pnpm run db:migrate`
3. correr `pnpm run db:bootstrap-auth`
4. correr `pnpm start`

## Migraciones Versionadas

El proyecto ya no depende de `ensureOperationalSchema()` para evolucionar el esquema.

Estado actual:

- las migraciones viven en `src/models/database/migrations/`
- el historial aplicado queda registrado en la tabla `schema_migrations`
- `pnpm start` no toca la estructura de DB
- `pnpm run db:migrate` es el mecanismo canonico para llevar el esquema al estado esperado

Regla operativa:

- cada cambio nuevo de esquema debe entrar como un nuevo archivo de migracion versionado
- no se deben introducir cambios estructurales nuevos en el arranque de la app
- `DB_SYNC=true` queda solo para compatibilidad controlada sobre esquemas legacy

## API

Prefijo base:

```text
/api
```

Recursos disponibles:

- `/users`
- `/clients`
- `/roles`
- `/profiles`
- `/equipments`
- `/requests`
- `/orders`
- `/schedules`

Ruta publica adicional:

- `POST /api/users/login`
- `GET /api/health`

Todos los endpoints bajo `/api` salvo login y health requieren `Authorization: Bearer <token>`.

El contrato operativo vigente esta documentado en:

- [docs/contracts/FRONTEND_API_SERVICES.md](./docs/contracts/FRONTEND_API_SERVICES.md)

## Testing

La suite actual usa `jest` y `supertest`.

Suites relevantes:

- login y autorizacion base
- `requests.integration`
- `orders.integration`
- `schedules.integration`

Ejecucion:

```bash
pnpm test
```

## Regla De Sincronizacion

Si cambias endpoints, payloads, permisos o campos del backend, actualiza en el mismo cambio:

1. [docs/contracts/FRONTEND_API_SERVICES.md](./docs/contracts/FRONTEND_API_SERVICES.md)
2. el consumidor en `../chillsage-frontend`

Para `equipments`, el frontend debe revisar en cada cambio:

- si `planeador` sigue teniendo formulario parcial o campos bloqueados para `name`, `type`, `brand`, `model`, `serial`, `code` y `client`
- si `DELETE` sigue visible solo para `admin`
- si los validadores de fechas y estados siguen alineados con el contrato backend

Para `users`, el frontend debe revisar en cada cambio:

- si `planeador` sigue limitado a lectura en listados y detalle
- si `create`, `edit` y `DELETE` siguen visibles solo para `admin`
- si las validaciones de `username`, `email`, `password` y `status` siguen alineadas con el contrato backend

## Otros Documentos

- [Revision tecnica](./docs/engineering/REVIEW.md)
- [Plan de hardening](./docs/engineering/HARDENING_PLAN.md)
- [Reglas de Git](./docs/process/GIT_RULES.md)
