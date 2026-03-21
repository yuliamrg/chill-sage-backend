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
- `DB_PORT`: puerto de MySQL. Si no existe, usa `3306`. Si levantas MySQL con [`db.yml`](/home/yuliamr/projects/chillsage/chill-sage-backend/db.yml), usa `3307`.
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

## Sincronizacion Con Frontend

Este backend no debe evolucionar como proyecto aislado. El frontend consumidor vive en:

- `../chillsage-frontend`

Regla de desarrollo:

- El backend es la fuente de verdad del contrato HTTP.
- Cada vez que cambie un payload de entrada o salida en backend, el cambio debe reflejarse en frontend en el mismo trabajo.
- Ningun cambio de campos queda completo si solo compila backend.

Puntos de sincronizacion en frontend:

- `src/app/core/models/domain.models.ts`: define el shape que usa la UI.
- `src/app/core/mappers/domain.mappers.ts`: traduce entre API y view model.
- `src/app/core/services/*.service.ts`: consume las llaves reales del backend.
- Componentes de formulario y listado: muestran o envian los campos.

Flujo obligatorio cuando cambias un recurso:

1. Cambia modelo, controlador y respuesta del backend.
2. Actualiza [FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/FRONTEND_API_SERVICES.md) con el contrato nuevo.
3. Refleja el cambio en `../chillsage-frontend`:
   - `domain.models.ts` si cambia el shape usado por la UI.
   - `domain.mappers.ts` si cambia el nombre de campos o aparecen/desaparecen campos.
   - el servicio del recurso si cambia la llave de respuesta o el endpoint.
   - formularios/listados si el campo se captura o se muestra.
4. Verifica backend con `node --check` o con arranque local.
5. Verifica frontend con `npm run build`.

Checklist minima por cambio de contrato:

- Si agregas un campo de salida: agregarlo al controlador y mapearlo en frontend.
- Si renombras un campo: actualizar mapper de entrada/salida y UI que lo consume.
- Si eliminas un campo: quitarlo de docs, mapper, modelos y componentes.
- Si agregas un campo obligatorio de entrada: actualizar formulario, validator y `map<Form>ToApi`.
- Si cambia la respuesta enriquecida: revisar `users`, `orders` y `equipments` y cualquier tabla que renderice nombres derivados.

Ejemplo con `requests`:

- Si backend agrega `priority` en `request.controller.js` y modelo Sequelize:
  - documentar `priority` en [FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/FRONTEND_API_SERVICES.md),
  - agregar `priority` a `RequestVm` y `RequestFormValue` en `../chillsage-frontend/src/app/core/models/domain.models.ts`,
  - mapear `priority` en `mapRequest` y `mapRequestFormToApi` en `../chillsage-frontend/src/app/core/mappers/domain.mappers.ts`,
  - actualizar `requests.service.ts` si cambia el endpoint o la llave,
  - agregar el control al formulario y a la tabla si debe verse en UI.

Si no haces esos pasos, backend y frontend quedan "compilando" pero desincronizados funcionalmente.

### Endpoints

Todos estos recursos exponen CRUD basico:

- `GET /api/<resource>`
- `GET /api/<resource>/:id`
- `POST /api/<resource>`
- `PUT /api/<resource>/:id`
- `DELETE /api/<resource>/:id`

Excepciones:

- `GET /api/users/:id`
- `POST /api/users/login`

Recursos con `GET /api/<resource>/:id` confirmado en el codigo actual:

- `users`
- `clients`
- `roles`
- `schedules`
- `requests`
- `profiles`
- `orders`
- `equipments`

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

### Respuestas enriquecidas

Algunos endpoints de lectura agregan campos derivados para simplificar el consumo desde frontend:

- `GET /api/users` y `GET /api/users/:id` incluyen `client_name` y `role_name`.
- `GET /api/equipments` y `GET /api/equipments/:id` incluyen `client_name`.
- `GET /api/orders` y `GET /api/orders/:id` incluyen `assigned_user_name` y `request_summary`.

Estos campos son informativos. Los ids canonicos siguen siendo `client`, `role`, `user_assigned_id` y `request_id`.

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
- `client_name`
- `role`
- `role_name`
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
- `client_name`
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
- `assigned_user_name`
- `request_id`
- `request_summary`
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
- `clients`, `schedules`, `requests`, `orders` y `equipments` ya exponen `GET /api/<resource>/:id`.
- `users`, `orders` y `equipments` ahora enriquecen algunas respuestas de lectura con nombres o descripciones relacionadas.

La documentacion de uso de este archivo describe el comportamiento actual del codigo. Los pendientes tecnicos vigentes quedaron resumidos en [`REVIEW.md`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/REVIEW.md).

## Reglas de Git

Las reglas de trabajo con ramas, commits y PR quedaron documentadas en [`GIT_RULES.md`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/GIT_RULES.md).
