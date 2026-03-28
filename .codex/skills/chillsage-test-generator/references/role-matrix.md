# Chillsage Role Matrix

Use this matrix when generating authorization tests. Verify the route file if the user is working on a branch that may have changed permissions.

## Roles

- `admin`
- `solicitante`
- `planeador`
- `tecnico`

## Global Rule

- `POST /api/users/login` is public.
- All other `/api/*` endpoints require Bearer auth.

## Route Access

### `/api/users`

- `GET /` => `admin`, `planeador`
- `GET /:id` => `admin`, `planeador`
- `POST /` => `admin`
- `PUT /:id` => `admin`
- `DELETE /:id` => `admin`

### `/api/roles`

- `GET /` => `admin`, `planeador`
- `GET /:id` => `admin`, `planeador`
- `POST /` => `admin`
- `PUT /:id` => `admin`
- `DELETE /:id` => `admin`

### `/api/clients`

- `GET /` => `admin`, `planeador`, `tecnico`
- `GET /:id` => `admin`, `planeador`, `tecnico`
- `POST /` => `admin`, `planeador`
- `PUT /:id` => `admin`, `planeador`
- `DELETE /:id` => `admin`

### `/api/equipments`

- `GET /` => `admin`, `planeador`, `tecnico`
- `GET /:id` => `admin`, `planeador`, `tecnico`
- `POST /` => `admin`, `planeador`
- `PUT /:id` => `admin`, `planeador`
- `DELETE /:id` => `admin`

### `/api/orders`

- `GET /` => `admin`, `planeador`, `tecnico`, `solicitante`
- `GET /:id` => `admin`, `planeador`, `tecnico`, `solicitante`
- `POST /` => `admin`, `planeador`
- `PUT /:id` => `admin`, `planeador`
- `DELETE /:id` => `admin`, `planeador`

### `/api/requests`

- `GET /` => `admin`, `planeador`, `tecnico`, `solicitante`
- `GET /:id` => `admin`, `planeador`, `tecnico`, `solicitante`
- `POST /` => `admin`, `planeador`, `solicitante`
- `PUT /:id` => `admin`, `planeador`
- `DELETE /:id` => `admin`, `planeador`

### `/api/profiles`

- `GET /` => `admin`, `planeador`
- `GET /:id` => `admin`, `planeador`
- `POST /` => `admin`
- `PUT /:id` => `admin`
- `DELETE /:id` => `admin`

### `/api/schedules`

- `GET /` => `admin`, `planeador`, `tecnico`
- `GET /:id` => `admin`, `planeador`, `tecnico`
- `POST /` => `admin`, `planeador`
- `PUT /:id` => `admin`, `planeador`
- `DELETE /:id` => `admin`, `planeador`
