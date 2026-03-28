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
- filtros por query en modulos operativos
- pruebas de integracion con `jest` y `supertest`
- CORS restringido por entorno para clientes web
- rate limiting en `POST /api/users/login`
- respuestas `500` saneadas para no exponer detalles internos

Lo que aun no existe o sigue incompleto:

- refresh token
- historial tecnico dedicado
- calificacion del servicio como recurso propio
- paginacion
- migraciones versionadas
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
- `DB_SYNC`: si vale `true`, `pnpm run db:ensure-schema` ejecuta `db.sync({ force: false })` antes del ensure operativo
- `JWT_SECRET`: secreto para firmar tokens
- `JWT_EXPIRES_IN`: duracion del access token. Default `8h`
- `CORS_ORIGINS`: lista separada por comas con los origins permitidos para navegador
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
- monta la API bajo `/api`

`pnpm start` ya no modifica esquema ni crea datos base.

## Compatibilidad Con Frontend

Si el frontend consume este backend desde navegador, debe alinearse con estas reglas actuales:

- el origin del frontend debe estar incluido en `CORS_ORIGINS`
- login puede responder `429` cuando excede `LOGIN_RATE_LIMIT_MAX` dentro de `LOGIN_RATE_LIMIT_WINDOW_MS`
- el frontend no debe depender de mensajes internos en errores `500`; ahora recibe mensajes genericos
- la autenticacion sigue siendo por `Authorization: Bearer <access_token>`; no hay cookie de sesion ni refresh token

Cambio esperado en frontend:

- agregar manejo explicito de `429` en login y bloquear reintentos agresivos
- mostrar mensaje de infraestructura o reintento para `500` sin intentar parsear detalle tecnico
- verificar que `VITE_API_URL` o equivalente apunte al backend y que su origin este permitido por `CORS_ORIGINS`

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
pnpm run db:ensure-schema
pnpm run db:bootstrap-auth
```

Que hace cada uno:

- `db:ensure-schema`: autentica DB, inicializa asociaciones, ejecuta `db.sync({ force: false })` solo si `DB_SYNC=true` y luego corre `ensureOperationalSchema()`
- `db:bootstrap-auth`: autentica DB, asegura roles base y crea o actualiza usuarios de prueba por rol

Flujo recomendado para una base nueva:

1. configurar `.env`
2. correr `pnpm run db:ensure-schema`
3. correr `pnpm run db:bootstrap-auth`
4. correr `pnpm start`

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

Todos los endpoints bajo `/api` salvo login requieren `Authorization: Bearer <token>`.

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

## Otros Documentos

- [Revision tecnica](./docs/engineering/REVIEW.md)
- [Plan de hardening](./docs/engineering/HARDENING_PLAN.md)
- [Reglas de Git](./docs/process/GIT_RULES.md)
