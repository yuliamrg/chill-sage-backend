# Chillsage Backend

Backend REST construido con `Express` y `Sequelize` para administrar usuarios, clientes, equipos, perfiles, roles, solicitudes, ordenes y horarios.

## Stack

- Node.js
- Express 4
- Sequelize 6
- MySQL
- bcrypt

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

El archivo [`db.yml`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/db.yml) contiene un ejemplo de `docker run` para levantar MySQL en el puerto `3307`, pero el codigo no expone una variable `DB_PORT`. Si se usa ese contenedor, hay que ajustar el acceso a la BD en consecuencia.

Al iniciar, el servidor ejecuta `db.sync({ force: false })`, por lo que Sequelize intentara sincronizar las tablas automaticamente.

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

Campos observados por modelo:

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
- `user_asigned_id`
- `resquest_id`
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
- `name`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### `profiles`

El recurso existe en rutas y controlador, pero su modelo tiene inconsistencias y hoy no representa con claridad una tabla `profiles`. Ver detalles en [`REVIEW.md`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/REVIEW.md).

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

La documentacion de uso de este archivo describe el comportamiento observado en el codigo actual. Los problemas detectados durante la revision quedaron separados en [`REVIEW.md`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/REVIEW.md).

## Reglas de Git

Las reglas de trabajo con ramas, commits y PR quedaron documentadas en [`GIT_RULES.md`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/GIT_RULES.md).
