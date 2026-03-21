# Guia para Crear Servicios de Frontend Contra la API Actual

Documento de integracion para desarrollo frontend consumiendo este backend tal como existe hoy.

Fecha de referencia: 2026-03-20

## Alcance

Esta guia describe el comportamiento actual del backend, no el deseado a futuro.

Puntos importantes:

- No hay autenticacion obligatoria en las rutas CRUD.
- El login existe, pero no entrega token.
- Las respuestas no siguen un contrato unico en todos los endpoints.
- El frontend debe consumir la API con una capa de normalizacion.

## Base URL

Por defecto el backend corre en:

```text
http://localhost:3000/api
```

Si `PORT` cambia, ajusta la URL base.

## Recomendacion de estructura en frontend

Crear una capa simple asi:

```text
src/
  services/
    apiClient.ts
    users.service.ts
    clients.service.ts
    roles.service.ts
    schedules.service.ts
    requests.service.ts
    profiles.service.ts
    orders.service.ts
    equipments.service.ts
```

## Cliente HTTP base

Puedes usar `fetch` o `axios`. Lo importante es centralizar:

- `baseURL`
- headers JSON
- parseo de errores
- normalizacion de respuestas

Ejemplo con `fetch`:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function apiRequest<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data?.msg ??
      data?.message ??
      data?.error ??
      'Error inesperado al consumir la API'

    throw new Error(message)
  }

  return data as T
}

export { apiRequest }
```

## Recurso users

Rutas disponibles:

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `POST /users/login`

### Formas de respuesta

`GET /users`

```json
{
  "status": true,
  "msg": "Obteniendo usuarios",
  "users": []
}
```

`GET /users/:id`

```json
{
  "status": true,
  "msg": "Usuario encontrado",
  "user": {}
}
```

`POST /users`

```json
{
  "status": true,
  "msg": "Usuario creado con exito",
  "user": {}
}
```

`POST /users/login`

```json
{
  "message": "Inicio de sesion exitoso",
  "user": {}
}
```

### Payload sugerido para crear usuario

Campos que el backend acepta hoy:

- `username`
- `name`
- `last_name`
- `email`
- `password`
- `client`
- `role`
- `status`
- `user_created_id`
- `user_updated_id`

Notas:

- Si no envias `status`, el backend usa `active`.
- Si no envias `role`, el backend usa `2`.
- El password se hashea en backend.
- El login busca por `email` o `username`.

### Servicio sugerido

```ts
import { apiRequest } from './apiClient'

export const usersService = {
  getAll: async () => {
    const data = await apiRequest<{ users: unknown[] }>('/users', 'GET')
    return data.users
  },

  getById: async (id: number | string) => {
    const data = await apiRequest<{ user: unknown }>('/users/' + id, 'GET')
    return data.user
  },

  create: async (payload: Record<string, unknown>) => {
    const data = await apiRequest<{ user: unknown }>('/users', 'POST', payload)
    return data.user
  },

  update: async (id: number | string, payload: Record<string, unknown>) => {
    const data = await apiRequest<{ user: unknown }>('/users/' + id, 'PUT', payload)
    return data.user
  },

  remove: async (id: number | string) => {
    const data = await apiRequest<{ user: unknown }>('/users/' + id, 'DELETE')
    return data.user
  },

  login: async (payload: { email?: string; username?: string; password: string }) => {
    const data = await apiRequest<{ user: unknown }>('/users/login', 'POST', payload)
    return data.user
  },
}
```

## Recursos CRUD simples

Estos recursos comparten el mismo patron:

- `GET /<resource>`
- `GET /<resource>/:id`
- `POST /<resource>`
- `PUT /<resource>/:id`
- `DELETE /<resource>/:id`

Recursos:

- `clients`
- `roles`
- `schedules`
- `requests`
- `profiles`
- `orders`
- `equipments`

### Forma general de respuesta

Listado:

```json
{
  "status": true,
  "msg": "Obteniendo ...",
  "<pluralKey>": []
}
```

Creacion:

```json
{
  "status": true,
  "msg": "... creado con exito",
  "<singularKey>": {}
}
```

Actualizacion:

```json
{
  "status": true,
  "msg": "... actualizado con exito",
  "<singularKey>": {}
}
```

Eliminacion:

```json
{
  "status": true,
  "msg": "... eliminado con exito",
  "<singularKey>": {}
}
```

### Llaves reales por recurso

Usa estas propiedades para leer la data:

| Recurso | Llave listado | Llave item |
| --- | --- | --- |
| clients | `clients` | `client` |
| roles | `roles` | `role` |
| schedules | `schedules` | `schedule` |
| requests | `requests` | `request` |
| profiles | `profiles` | `profile` |
| orders | `orders` | `order` |
| equipments | `equipments` | `equipment` |

### Recursos con `getById` disponible

En el codigo actual puedes implementar `getById` para:

- `clients`
- `roles`
- `schedules`
- `requests`
- `profiles`
- `orders`
- `equipments`

### Campos enriquecidos a considerar

Algunas respuestas de lectura ya incluyen datos listos para UI:

- `users`: `client_name`, `role_name`
- `orders`: `assigned_user_name`, `request_summary`
- `equipments`: `client_name`

Tratalos como campos derivados. Para guardar o editar, sigue usando los ids originales.

### Factory opcional para reducir codigo

```ts
import { apiRequest } from './apiClient'

function createCrudService<T>(resource: string, listKey: string, itemKey: string) {
  return {
    getAll: async (): Promise<T[]> => {
      const data = await apiRequest<Record<string, T[]>>(`/${resource}`, 'GET')
      return data[listKey] ?? []
    },

    getById: async (id: number | string): Promise<T> => {
      const data = await apiRequest<Record<string, T>>(`/${resource}/${id}`, 'GET')
      return data[itemKey]
    },

    create: async (payload: Record<string, unknown>): Promise<T> => {
      const data = await apiRequest<Record<string, T>>(`/${resource}`, 'POST', payload)
      return data[itemKey]
    },

    update: async (id: number | string, payload: Record<string, unknown>): Promise<T> => {
      const data = await apiRequest<Record<string, T>>(`/${resource}/${id}`, 'PUT', payload)
      return data[itemKey]
    },

    remove: async (id: number | string): Promise<T> => {
      const data = await apiRequest<Record<string, T>>(`/${resource}/${id}`, 'DELETE')
      return data[itemKey]
    },
  }
}

export const clientsService = createCrudService('clients', 'clients', 'client')
export const rolesService = createCrudService('roles', 'roles', 'role')
export const schedulesService = createCrudService('schedules', 'schedules', 'schedule')
export const requestsService = createCrudService('requests', 'requests', 'request')
export const profilesService = createCrudService('profiles', 'profiles', 'profile')
export const ordersService = createCrudService('orders', 'orders', 'order')
export const equipmentsService = createCrudService('equipments', 'equipments', 'equipment')
```

## Campos por recurso

Usa esto como referencia para formularios y tipos frontend.

### clients

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

### roles

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### schedules

- `id`
- `name`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### requests

- `id`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### profiles

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### orders

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

### equipments

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

## Recomendaciones practicas para el frontend actual

### 1. No dependas de token

Hoy el backend no usa Bearer token. Mientras siga asi:

- no agregues interceptor de autorizacion obligatorio
- guarda el usuario de login solo para estado UI
- no asumas persistencia de sesion desde backend

### 2. Normaliza errores

El backend puede responder con:

- `msg`
- `message`
- `error`

Tu capa HTTP debe convertir eso a una sola forma util para la UI.

### 3. Normaliza entidades

Como algunas respuestas usan llaves distintas, conviene que tus servicios siempre retornen solo la entidad o el arreglo, no la respuesta completa.

### 4. Maneja 404 y 401 de forma simple

Hoy el login devuelve `401` si no encuentra usuario o si la contrasena es incorrecta.

Sugerencia:

- mostrar mensaje de credenciales invalidas
- no diferenciar demasiado en la UI

### 5. Evita exponer campos internos si no los necesitas

Aunque el backend acepte campos como `user_created_id` o `user_updated_id`, no los muestres ni edites desde formularios si no aportan valor en esta etapa.

## Ejemplo de variables de entorno frontend

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Checklist de integracion rapida

1. Levantar backend en `http://localhost:3000`.
2. Configurar `VITE_API_BASE_URL`.
3. Crear `apiClient`.
4. Crear `usersService`.
5. Crear factory CRUD para el resto.
6. Normalizar errores y respuestas.
7. Probar manualmente login, listado, creacion, edicion y eliminacion.

## Limitaciones actuales a tener presentes

- Sin token ni middleware de auth.
- Sin paginacion.
- Sin filtros.
- Sin contrato uniforme de errores.
- Sin pruebas automatizadas en backend.

Eso no impide el desarrollo del frontend ahora, pero si exige una capa de servicios ordenada para absorber futuros cambios del backend.
