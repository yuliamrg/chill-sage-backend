# Chillsage Backend

Backend REST construido con `Express` y `Sequelize` para administrar usuarios, clientes, equipos, perfiles, roles, solicitudes, ordenes y horarios.

## Stack

- Node.js
- Express 4
- Sequelize 6
- MySQL
- bcrypt 6

## Estructura

```text
index.js
src/
  controllers/
  models/
  routes/
```

Arquitectura actual:

- `index.js` inicializa Express, CORS, parseo JSON y monta la API en `/api`.
- `src/routes/` agrupa rutas por recurso.
- `src/controllers/` implementa la logica CRUD.
- `src/models/` define los modelos Sequelize.
- `src/models/database/dbconnection.js` crea la conexion a MySQL.

## Requisitos

- Node.js 18+ recomendado
- MySQL disponible
- Dependencias instaladas con `npm install`

## Variables de entorno

El proyecto usa estas variables:

- `PORT`: puerto HTTP del servidor. Opcional. Default: `3000`.
- `DB_NAME`: nombre de la base de datos.
- `DB_USER`: usuario de base de datos.
- `DB_PASSWORD`: contrasena de base de datos.
- `DB_HOSTNAME`: host de MySQL. Si no existe, usa `127.0.0.1`.
- `DB_PORT`: puerto de MySQL. Si no existe, usa `3306`.
- `DB_SYNC`: si vale `true`, ejecuta `db.sync({ force: false })` al iniciar. Por defecto no sincroniza el esquema automaticamente.

Referencia rapida en [`.env.example`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/.env.example).

## Instalacion

```bash
npm install
```

Crear `.env` a partir de `.env.example` y luego iniciar:

```bash
npm start
```

## Base de datos

La conexion real configurada en el codigo usa MySQL con Sequelize, en [dbconnection.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/database/dbconnection.js).

El archivo [`db.yml`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/db.yml) contiene un ejemplo de `docker run` para levantar MySQL. La app permite configurar el puerto con `DB_PORT`.

Comportamiento de arranque:

- Siempre valida la conexion con `db.authenticate()` antes de abrir el puerto HTTP.
- Solo ejecuta sincronizacion de modelos si `DB_SYNC=true`.

Uso recomendado:

- En una base de datos existente: iniciar con `DB_SYNC` ausente o en `false`.
- En desarrollo controlado, con esquema alineado al codigo: usar `DB_SYNC=true` si realmente necesitas que Sequelize cree o ajuste tablas faltantes.

## API

Prefijo base: `/api`

Recursos disponibles:

- `/users`
- `/clients`
- `/roles`
- `/schedules`
- `/requests`
- `/profiles`
- `/orders`
- `/equipments`

### Endpoints

Todos estos recursos exponen CRUD basico:

- `GET /api/<resource>`
- `POST /api/<resource>`
- `PUT /api/<resource>/:id`
- `DELETE /api/<resource>/:id`

Excepciones:

- `GET /api/users/:id`
- `POST /api/users/login`

### Login

`POST /api/users/login`

Body esperado:

```json
{
  "email": "user@example.com",
  "username": "opcional_si_envias_email",
  "password": "secret"
}
```

La busqueda se hace por `email` o `username`.

La respuesta no expone el hash de `password`.

### Manejo de JSON invalido

Si el body contiene JSON mal formado, el middleware global responde `400` con:

```json
{
  "error": "Invalid JSON format",
  "details": "Unexpected token ...",
  "position": "15"
}
```

## Modelos

Campos definidos por modelo:

### `users`

- `id`
- `username`
- `name`
- `last_name`
- `email`
- `password`
- `client`
- `role`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

Notas:

- `username` y `email` son unicos.
- `createUser` aplica hash con `bcrypt`.
- Si no se envian, `status` toma `active` y `role` toma `2`.

### `clients`

- `id`
- `name`
- `address`
- `phone`
- `email`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### `equipments`

- `id`
- `name`
- `type`
- `location`
- `brand`
- `model`
- `serial`
- `code`
- `alias`
- `client`
- `description`
- `status`
- `use_start_at`
- `use_end_at`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### `orders`

- `id`
- `user_assigned_id`
- `request_id`
- `status`
- `start_date`
- `end_date`
- `description`
- `hours`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### `requests`

- `id`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### `schedules`

- `id`
- `name`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### `roles`

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

Nota:

- El modelo actual usa `description` como campo unico.

### `profiles`

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

Nota:

- Si la tabla `profiles` no existe, Sequelize puede crearla cuando `DB_SYNC=true`.

## Ejemplos rapidos

Crear usuario:

```bash
curl -X POST http://localhost:3000/api/users ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"name\":\"Ada\",\"last_name\":\"Lovelace\",\"email\":\"ada@example.com\",\"password\":\"secret123\",\"client\":1,\"role\":1,\"status\":\"active\",\"created_at\":\"2025-01-01T00:00:00.000Z\"}"
```

Consultar equipos:

```bash
curl http://localhost:3000/api/equipments
```

## Estado actual

El backend arranca correctamente con `npm start` siempre que la base de datos configurada este disponible y el puerto HTTP no este ocupado.

Cambios recientes relevantes:

- `orders` ya usa `user_assigned_id` y `request_id` como nombres canonicos en codigo y base de datos.
- `bcrypt` fue actualizado a la rama `6.x`, eliminando el warning deprecado que venia por `@mapbox/node-pre-gyp` al arrancar en Node 24.

La documentacion de uso de este archivo describe el comportamiento actual del codigo. Los pendientes tecnicos vigentes quedaron resumidos en [`REVIEW.md`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/REVIEW.md).

## Reglas de Git

Las reglas de trabajo con ramas, commits y PR quedaron documentadas en [`GIT_RULES.md`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/GIT_RULES.md).
