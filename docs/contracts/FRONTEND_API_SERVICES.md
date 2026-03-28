# Contrato Frontend - API Actual

Documento de referencia del backend segun el codigo actual del repositorio.

Fecha de referencia: `2026-03-28`

## Alcance

Este documento describe la API real implementada hoy.

Si hay diferencia entre este archivo y los documentos de `docs/context/`, para integrar frontend sobre este backend debes seguir este contrato.

## Base URL

```text
http://localhost:<PORT>/api
```

El puerto depende de `PORT` en `.env`. Si no existe, el backend usa `3000`.

## Recursos Disponibles

- `users`
- `clients`
- `roles`
- `profiles`
- `equipments`
- `requests`
- `orders`
- `schedules`

Ruta publica adicional:

- `POST /users/login`
- `GET /health`

Todos los demas endpoints requieren:

- header `Authorization: Bearer <access_token>`

## Compatibilidad Operativa Para Frontend Web

El hardening reciente agrega estas condiciones de integracion:

- el frontend debe consumir la API desde un origin incluido en `CORS_ORIGINS`
  En desarrollo con Angular CLI, eso normalmente implica `http://localhost:4200` y `http://127.0.0.1:4200`.
- `POST /users/login` puede responder `429` por rate limiting
- las respuestas `500` ya no deben asumirse con detalle tecnico interno
- toda respuesta incluye header `X-Request-Id`
- el cliente puede enviar `X-Request-Id` y el backend lo reutiliza en la respuesta
- la autenticacion sigue siendo solo por token Bearer en header; no hay cookies ni refresh token

Checklist minima para frontend:

- configurar `VITE_API_URL` o equivalente contra el backend correcto
- alinear el origin del frontend con `CORS_ORIGINS` del backend
- si se usa `ng serve`, registrar `http://localhost:4200` y `http://127.0.0.1:4200`
- manejar `401`, `403`, `409`, `429` y `500` como estados esperados del contrato
- no depender de mensajes de error internos ni de stacks
- conservar `X-Request-Id` en logs del frontend o reportes de error si existe

## Estructura Base De Respuesta

La API responde con esta forma:

```json
{
  "status": true,
  "msg": "Mensaje descriptivo",
  "...payload": "datos"
}
```

### Exito con lista

```json
{
  "status": true,
  "msg": "Obteniendo solicitudes",
  "requests": []
}
```

### Exito con item

```json
{
  "status": true,
  "msg": "Orden encontrada",
  "order": {}
}
```

### Error tipico

```json
{
  "status": false,
  "msg": "Solicitud no encontrada",
  "request": null
}
```

### Error de rate limiting en login

```json
{
  "status": false,
  "msg": "Demasiados intentos de inicio de sesion. Intenta nuevamente mas tarde",
  "user": null
}
```

### Error `500` endurecido

```json
{
  "status": false,
  "msg": "Unexpected server error"
}
```

### Header de correlacion

Todas las respuestas incluyen:

```text
X-Request-Id: <uuid-o-id-propagado>
```

## Convenciones

- los listados devuelven una llave plural
- detalle, create, update, action y delete devuelven una llave singular
- errores de item suelen devolver la llave singular en `null`
- errores de lista suelen devolver la llave plural en `[]`
- conflictos de dominio usan `409`
- falta de autenticacion usa `401`
- falta de permiso usa `403`
- rate limit de login usa `429`
- en `requests`, `orders` y `schedules` el frontend no debe intentar cambiar `status` por `PUT`
- las transiciones de negocio viven en endpoints de accion dedicados

## Login

Ruta:

- `POST /users/login`

Payload de frontend:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Notas reales:

- devuelve `access_token` JWT Bearer
- no crea sesion persistente server-side
- frontend debe autenticarse con `email` y `password`
- backend tambien acepta `username` como compatibilidad legacy
- `username` debe tratarse como compatibilidad legacy del backend, no como contrato vigente para frontend
- responde `400` si falta `password` o faltan `email` y `username`
- responde `401` si el usuario no existe, esta inactivo o la contrasena no coincide
- responde `429` si excede el limite configurado de intentos fallidos
- el campo `password` nunca se devuelve

Respuesta actual:

```json
{
  "status": true,
  "msg": "Inicio de sesion exitoso",
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": "8h",
  "user": {}
}
```

## Autenticacion Y Autorizacion

Comportamiento real:

- `POST /users/login` es publico
- `GET /health` es publico
- todo el resto de rutas bajo `/api` requiere token Bearer
- sin token valido el backend responde `401`
- con token valido pero sin permiso suficiente responde `403`

Roles base actuales:

- `1`: `admin`
- `2`: `solicitante`
- `3`: `planeador`
- `4`: `tecnico`

## Recursos CRUD Basicos

Los siguientes recursos siguen expuestos principalmente como CRUD:

- `roles`
- `profiles`

Rutas base:

- `GET /<resource>`
- `GET /<resource>/:id`
- `POST /<resource>`
- `PUT /<resource>/:id`
- `DELETE /<resource>/:id`

### Users

`users` sigue siendo un recurso maestro administrativo, pero ya no debe tratarse como CRUD completamente libre solo porque mantenga rutas base.

#### Endpoints

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

#### Campos de lectura

- `id`
- `username`
- `name`
- `last_name`
- `email`
- `client`
- `role`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`
- `client_name`
- `role_name`

#### Campos permitidos en create

```json
{
  "username": "planner.norte",
  "name": "Paula",
  "last_name": "Lopez",
  "email": "paula.lopez@example.com",
  "password": "Passw0rd!",
  "client": 1,
  "role": 3,
  "status": "active"
}
```

Reglas:

- `username`, `email`, `password`, `role` y `status` son obligatorios
- si frontend omite `role`, backend usa `solicitante` como default operativo
- si frontend omite `status`, backend usa `active` como default operativo
- `username` debe cumplir `^[A-Za-z0-9._-]{3,50}$`
- `email` debe ser valido
- `password` debe tener al menos 8 caracteres y no puede ser vacia
- si se envia `client`, debe referenciar un cliente existente
- `role` debe referenciar un rol existente
- `status` solo acepta `active` o `inactive`
- `username` y `email` deben ser unicos; colisiones responden `409`
- `user_created_id` enviado por frontend se ignora; auditoria la define el backend
- el campo `password` nunca se devuelve en respuestas

#### Campos permitidos en update

- `username`
- `name`
- `last_name`
- `email`
- `password`
- `client`
- `role`
- `status`

Restriccion por rol:

- solo `admin` puede crear, editar o eliminar usuarios
- `planeador` conserva solo lectura

Reglas adicionales:

- el propio `admin` autenticado no puede cambiar su `role`
- el propio `admin` autenticado no puede cambiar su `status`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

#### Estados

- `active`
- `inactive`

#### Reglas de acceso

- `GET`: `admin`, `planeador`
- `POST`: solo `admin`
- `PUT`: solo `admin`
- `DELETE`: solo `admin`

#### Reglas de negocio

- el frontend no debe asumir que `DELETE` depende solo del rol
- un usuario no puede eliminarse a si mismo; responde `409`
- un usuario con `requests` creadas, `requests` revisadas u `orders` asignadas responde `409`
- si frontend ofrece rotacion de password, debe tratarla como cambio sensible solo para `admin`

#### Guia de frontend por rol

- `admin`: mostrar formulario completo de alta y edicion
- `planeador`: mantener listados y detalle en solo lectura
- ocultar `create`, `edit` y `DELETE` para cualquier rol distinto de `admin`
- si existe una sola pantalla de detalle para `admin` y `planeador`, dejar todos los controles bloqueados cuando el actor no sea `admin`

## Recursos Operativos

### Requests

`requests` representa la necesidad inicial de servicio.

#### Endpoints

- `GET /requests`
- `GET /requests/:id`
- `POST /requests`
- `PUT /requests/:id`
- `POST /requests/:id/approve`
- `POST /requests/:id/cancel`
- `DELETE /requests/:id`

#### Campos de lectura

- `id`
- `client_id`
- `requester_user_id`
- `equipment_id`
- `type`
- `title`
- `description`
- `priority`
- `status`
- `requested_at`
- `reviewed_at`
- `reviewed_by_user_id`
- `review_notes`
- `cancel_reason`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`
- `client_name`
- `requester_name`
- `equipment_name`
- `equipment_code`
- `order_id`
- `order_status`

#### Campos permitidos en create

```json
{
  "client_id": 1,
  "requester_user_id": 10,
  "equipment_id": 22,
  "type": "corrective",
  "title": "Falla de compresor",
  "description": "El equipo no enfria",
  "priority": "high"
}
```

Notas:

- `requester_user_id` es forzado al usuario autenticado si el actor es `solicitante`
- si no se envia `requester_user_id`, el backend usa el usuario autenticado
- si no se envia `client_id`, el backend intenta usar el `client` del usuario autenticado
- `type` default: `corrective`
- `priority` default: `medium`
- `status` nace en `pending`
- `requested_at` lo define backend

#### Campos permitidos en update

- `client_id`
- `requester_user_id`
- `equipment_id`
- `type`
- `title`
- `description`
- `priority`

Restriccion:

- `PUT` solo edita campos operativos de una solicitud `pending`
- solicitudes `approved` o `cancelled` no se editan por `PUT`
- `status`, `reviewed_at`, `reviewed_by_user_id`, `review_notes` y `cancel_reason` se controlan por acciones explicitas
- frontend no debe renderizar selector libre de `status` para solicitudes

#### Estados

- `pending`
- `approved`
- `cancelled`

#### Acciones

`POST /requests/:id/approve`

Payload:

```json
{
  "review_notes": "Validada para ejecucion"
}
```

Efectos:

- cambia `status` a `approved`
- fija `reviewed_at`
- fija `reviewed_by_user_id`
- limpia `cancel_reason`
- solo funciona si la solicitud sigue en `pending`

`POST /requests/:id/cancel`

Payload:

```json
{
  "cancel_reason": "Equipo fuera de servicio",
  "review_notes": "No procede"
}
```

Efectos:

- cambia `status` a `cancelled`
- exige `cancel_reason`
- solo funciona si la solicitud sigue en `pending`
- falla si la solicitud ya genero una orden

#### Filtros de listado

- `client_id`
- `requester_user_id`
- `equipment_id`
- `status`
- `type`
- `date_from`
- `date_to`

#### Reglas de acceso

- `GET`: `admin`, `planeador`, `tecnico`, `solicitante`
- `POST`: `admin`, `planeador`, `solicitante`
- `PUT`: `admin`, `planeador`
- `approve` y `cancel`: `admin`, `planeador`
- `DELETE`: solo `admin`

#### Reglas de negocio

- el equipo debe pertenecer al cliente indicado
- el solicitante asociado debe existir y estar activo
- `solicitante` solo puede consultar sus solicitudes o las de su cliente
- si la solicitud ya no esta en `pending`, frontend debe tratarla como solo lectura

#### Guia de frontend por estado

- `pending`: permitir `editar`, `approve` y `cancel` segun rol
- `approved`: mostrar datos de revision y habilitar crear orden si el rol lo permite; bloquear `PUT`
- `cancelled`: solo lectura; no ofrecer `approve`, `cancel` ni crear orden

### Clients

`clients` sigue siendo un recurso maestro, pero ya no debe tratarse como CRUD totalmente libre para `planeador`.

#### Endpoints

- `GET /clients`
- `GET /clients/:id`
- `POST /clients`
- `PUT /clients/:id`
- `DELETE /clients/:id`

#### Campos de lectura

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

#### Campos permitidos en create

```json
{
  "name": "Cliente Norte",
  "address": "Calle 100 #10-20",
  "phone": "+57 300 123 4567",
  "email": "operaciones@cliente-norte.com",
  "description": "Cliente corporativo con varias sedes",
  "status": "active"
}
```

Reglas:

- `name`, `email` y `status` son obligatorios
- strings obligatorios vacios o solo con espacios responden `400`
- `email` debe ser valido
- si se envia `phone`, debe tener formato valido y al menos 7 digitos
- `status` solo acepta `active` o `inactive`
- `user_created_id` enviado por frontend se ignora; auditoria la define el backend

#### Campos permitidos en update

- `name`
- `address`
- `phone`
- `email`
- `description`
- `status`

Restriccion por rol:

- `admin` puede editar todos los campos permitidos
- `planeador` solo puede editar campos operativos: `address`, `phone`, `description`, `status`
- `planeador` no puede cambiar datos maestros base: `name`, `email`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

#### Estados

- `active`
- `inactive`

#### Reglas de acceso

- lectura: `admin`, `planeador`, `tecnico`
- create: `admin`, `planeador`
- update: `admin`, `planeador`
- delete: solo `admin`

#### Reglas de negocio

- frontend no debe asumir que `DELETE` siempre depende solo del rol
- un cliente con `users`, `equipments`, `requests`, `orders` o `schedules` asociados responde `409`
- si frontend ofrece accion de eliminacion, debe reservarla para clientes huerfanos o manejar el `409` con mensaje claro

### Equipments

`equipments` sigue siendo un recurso administrativo, pero ya no debe tratarse como CRUD libre en frontend.

#### Endpoints

- `GET /equipments`
- `GET /equipments/:id`
- `POST /equipments`
- `PUT /equipments/:id`
- `DELETE /equipments/:id`

#### Campos de lectura

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
- `client_name`

#### Campos permitidos en create

```json
{
  "name": "Chiller piso 3",
  "type": "cooling",
  "location": "Cuarto tecnico",
  "brand": "Carrier",
  "model": "30XA",
  "serial": "CH-30XA-001",
  "code": "EQ-003",
  "alias": "Chiller principal",
  "client": 1,
  "description": "Equipo principal de enfriamiento",
  "status": "active",
  "use_start_at": "2026-03-20T08:00:00.000Z",
  "use_end_at": "2026-03-30T18:00:00.000Z"
}
```

Reglas:

- `name`, `serial`, `code`, `client` y `status` son obligatorios
- strings obligatorios vacios o solo con espacios responden `400`
- `client` debe referenciar un cliente existente
- `status` solo acepta `active`, `inactive`, `maintenance` o `retired`
- si se envian fechas, `use_end_at` no puede ser menor que `use_start_at`
- `user_created_id` enviado por frontend se ignora; auditoria la define el backend

#### Campos permitidos en update

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

Restriccion por rol:

- `admin` puede editar todos los campos permitidos
- `planeador` solo puede editar campos operativos: `location`, `alias`, `description`, `status`, `use_start_at`, `use_end_at`
- `planeador` no puede cambiar datos maestros base: `name`, `type`, `brand`, `model`, `serial`, `code`, `client`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

#### Estados

- `active`
- `inactive`
- `maintenance`
- `retired`

#### Reglas de acceso

- `GET`: `admin`, `planeador`, `tecnico`
- `POST`: `admin`, `planeador`
- `PUT`: `admin`, `planeador`
- `DELETE`: solo `admin`

#### Reglas de negocio

- `planeador` puede mantener datos operativos del equipo, pero no redefinir identidad maestra
- `tecnico` conserva acceso de lectura; no tiene permisos de escritura
- el frontend no debe asumir que todo `PUT /equipments/:id` permitido por rol puede mutar cualquier campo

#### Guia de frontend por rol

- `admin`: mostrar formulario completo de alta y edicion
- `planeador`: mostrar formulario parcial o campos bloqueados para datos maestros base
- `tecnico`: detalle y listados en solo lectura
- ocultar `DELETE` para cualquier rol distinto de `admin`

### Orders

`orders` representa la ejecucion tecnica derivada de una solicitud aprobada.

#### Endpoints

- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
- `PUT /orders/:id`
- `POST /orders/:id/assign`
- `POST /orders/:id/start`
- `POST /orders/:id/complete`
- `POST /orders/:id/cancel`
- `DELETE /orders/:id`

#### Campos de lectura

- `id`
- `request_id`
- `client_id`
- `equipment_id`
- `assigned_user_id`
- `type`
- `status`
- `planned_start_at`
- `started_at`
- `finished_at`
- `diagnosis`
- `work_description`
- `closure_notes`
- `cancel_reason`
- `received_satisfaction`
- `worked_hours`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`
- `assigned_user_name`
- `request_summary`
- `request_status`
- `client_name`
- `equipment_name`
- `equipment_code`

#### Campos permitidos en create

```json
{
  "request_id": 15,
  "assigned_user_id": 7,
  "planned_start_at": "2026-03-22T14:00:00.000Z",
  "diagnosis": "Pendiente de inspeccion",
  "closure_notes": null,
  "received_satisfaction": null
}
```

Notas:

- `request_id` es obligatorio
- la orden hereda `client_id`, `equipment_id` y `type` desde la solicitud
- si se envia `assigned_user_id`, debe pertenecer a un usuario tecnico activo
- la orden nace en `assigned`

#### Campos permitidos en update

- `assigned_user_id`
- `planned_start_at`
- `diagnosis`
- `closure_notes`
- `received_satisfaction`

Restriccion:

- no se puede editar una orden `completed` o `cancelled`
- `PUT` no acepta cambios de `status` ni campos propios de `start`, `complete` o `cancel`
- frontend no debe usar `PUT` para simular `assign`, `start`, `complete` o `cancel`

#### Estados

- `assigned`
- `in_progress`
- `completed`
- `cancelled`

#### Acciones

`POST /orders/:id/assign`

Payload:

```json
{
  "assigned_user_id": 7,
  "planned_start_at": "2026-03-22T14:00:00.000Z"
}
```

Reglas:

- exige `assigned_user_id`
- solo permite usuarios tecnicos activos
- no aplica sobre ordenes `completed` o `cancelled`

`POST /orders/:id/start`

Payload:

```json
{
  "started_at": "2026-03-22T14:10:00.000Z"
}
```

Reglas:

- solo inicia ordenes `assigned`
- exige tecnico asignado
- si el actor es `tecnico`, debe ser el tecnico asignado
- si no se envia `started_at`, backend usa fecha actual

`POST /orders/:id/complete`

Payload:

```json
{
  "finished_at": "2026-03-22T16:30:00.000Z",
  "worked_hours": 2.3,
  "work_description": "Se reemplazo capacitor y se estabilizo presion",
  "closure_notes": "Operacion normalizada",
  "diagnosis": "Capacitor defectuoso",
  "received_satisfaction": true
}
```

Reglas:

- solo completa ordenes `in_progress`
- si el actor es `tecnico`, debe ser el tecnico asignado
- exige `work_description`
- exige `worked_hours`
- exige `started_at` existente
- valida que `finished_at` no sea anterior a `started_at`

`POST /orders/:id/cancel`

Payload:

```json
{
  "cancel_reason": "Solicitud duplicada"
}
```

Reglas:

- exige `cancel_reason`
- no permite cancelar una orden `completed`
- falla si la orden ya estaba `cancelled`

#### Filtros de listado

- `client_id`
- `equipment_id`
- `assigned_user_id`
- `status`
- `type`
- `date_from`
- `date_to`

#### Reglas de acceso

- `GET`: `admin`, `planeador`, `tecnico`, `solicitante`
- `POST`, `PUT`, `assign`, `cancel`: `admin`, `planeador`
- `start`, `complete`: `admin`, `planeador`, `tecnico`
- `DELETE`: solo `admin`

#### Reglas de negocio

- solo se crea desde una `request` en `approved`
- una `request` no puede tener mas de una `order` activa
- `tecnico` solo puede consultar sus ordenes asignadas
- `solicitante` solo puede consultar ordenes derivadas de sus solicitudes o de su cliente
- `cancel` solo aplica sobre ordenes `assigned` o `in_progress`

#### Guia de frontend por estado

- `assigned`: permitir `assign`, `start`, `cancel` y edicion administrativa por `PUT`
- `in_progress`: permitir `complete` y `cancel`; bloquear `assign` y evitar editar campos de cierre por `PUT`
- `completed`: solo lectura; no ofrecer `PUT`, `assign`, `start`, `complete` ni `cancel`
- `cancelled`: solo lectura; no ofrecer acciones adicionales
- si el actor es `tecnico`, solo mostrar `start` y `complete` cuando la orden este asignada a ese mismo tecnico

### Schedules

`schedules` representa cronogramas por cliente y equipos.

#### Endpoints

- `GET /schedules`
- `GET /schedules/:id`
- `POST /schedules`
- `PUT /schedules/:id`
- `POST /schedules/:id/open`
- `POST /schedules/:id/close`
- `DELETE /schedules/:id`

#### Campos de lectura

- `id`
- `client_id`
- `name`
- `type`
- `scheduled_date`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`
- `client_name`
- `equipment_ids`
- `equipments`

`equipments` se devuelve como arreglo resumido:

```json
[
  {
    "id": 22,
    "name": "Chiller piso 3",
    "code": "EQ-003",
    "status": "active"
  }
]
```

#### Campos permitidos en create

```json
{
  "client_id": 1,
  "name": "Preventivo marzo",
  "type": "preventive",
  "scheduled_date": "2026-03-28T00:00:00.000Z",
  "description": "Mantenimiento mensual",
  "equipment_ids": [22, 23]
}
```

#### Campos permitidos en update

- `client_id`
- `name`
- `type`
- `scheduled_date`
- `description`
- `equipment_ids` opcional para reemplazar relaciones

Restriccion:

- no se puede editar un cronograma `closed`
- `PUT` no acepta cambios directos de `status`
- frontend no debe exponer selector de estado editable para cronogramas

#### Estados

- `unassigned`
- `open`
- `closed`

#### Acciones

`POST /schedules/:id/open`

Payload:

```json
{}
```

Reglas:

- cambia `status` a `open`
- solo funciona desde `unassigned`
- falla si ya estaba abierto
- no permite reabrir cronogramas `closed`

`POST /schedules/:id/close`

Payload:

```json
{}
```

Reglas:

- cambia `status` a `closed`
- solo funciona desde `open`
- falla si ya estaba cerrado

#### Filtros de listado

- `client_id`
- `status`
- `type`
- `date_from`
- `date_to`

#### Reglas de acceso

- `GET`: `admin`, `planeador`, `tecnico`
- `POST`, `PUT`, `open`, `close`: `admin`, `planeador`
- `DELETE`: solo `admin`

#### Reglas de negocio

- exige `client_id`, `name`, `type`, `scheduled_date` y al menos un equipo
- todos los equipos deben existir
- todos los equipos deben pertenecer al mismo cliente
- no acepta equipos en estado `de_baja`, `retirado` o `retired`

#### Guia de frontend por estado

- `unassigned`: permitir `PUT` y accion `open`
- `open`: permitir `PUT` y accion `close`; no ofrecer `open` nuevamente
- `closed`: solo lectura; bloquear `PUT`, `open` y `close`
- no ofrecer `close` directamente desde `unassigned`

## Campos Enriquecidos En Otros Recursos

### Users

- `client_name`
- `role_name`

### Equipments

- `client_name`

## Llaves De Payload

| Recurso | Llave listado | Llave item |
| --- | --- | --- |
| users | `users` | `user` |
| clients | `clients` | `client` |
| roles | `roles` | `role` |
| profiles | `profiles` | `profile` |
| equipments | `equipments` | `equipment` |
| requests | `requests` | `request` |
| orders | `orders` | `order` |
| schedules | `schedules` | `schedule` |

## Matriz Inicial De Acceso

- `admin`: acceso total
- `planeador`: operacion completa sin `DELETE` en recursos operativos
- `tecnico`: lectura operativa y ejecucion de sus ordenes asignadas
- `solicitante`: crear y consultar solicitudes; consultar ordenes dentro de su alcance

Detalle real:

- `users`: lectura `admin`, `planeador`; create/update/delete solo `admin`
- `roles`: `GET` para `admin` y `planeador`; escritura solo `admin`
- `profiles`: `GET` para `admin` y `planeador`; escritura solo `admin`
- `clients`: lectura `admin`, `planeador`, `tecnico`; create/update `admin`, `planeador`; delete solo `admin`
- `equipments`: lectura `admin`, `planeador`, `tecnico`; create/update `admin`, `planeador`; delete solo `admin`
- `requests`: lectura `admin`, `planeador`, `tecnico`, `solicitante`; create `admin`, `planeador`, `solicitante`; update `admin`, `planeador`; approve/cancel `admin`, `planeador`; delete solo `admin`
- `orders`: lectura `admin`, `planeador`, `tecnico`, `solicitante`; create/update/assign/cancel `admin`, `planeador`; start/complete `admin`, `planeador`, `tecnico`; delete solo `admin`
- `schedules`: lectura `admin`, `planeador`, `tecnico`; create/update/open/close `admin`, `planeador`; delete solo `admin`

## Impacto En Frontend

Cuando cambie el contrato del backend, revisa como minimo:

- `src/app/core/models/domain.models.ts`
- `src/app/core/mappers/domain.mappers.ts`
- `src/app/core/services/<resource>.service.ts`
- `src/app/features/auth/**` para login por `email`
- formularios de alta y edicion
- listados con filtros operativos
- detalle y acciones de transicion por estado

Puntos concretos a alinear en frontend con el hardening actual:

- usar `email` como identificador de login
- asegurarse de que el dominio o puerto del frontend este incluido en `CORS_ORIGINS`
- para desarrollo local con Angular, asumir `http://localhost:4200` como origin base salvo configuracion distinta
- manejar `429` en login con UI de espera o mensaje de reintento
- no depender de `error.message`, stacks o detalles internos en respuestas `500`
- seguir enviando `Authorization: Bearer <token>` en todas las rutas privadas
- dejar de tratar `users` como CRUD editable para cualquier actor con acceso al modulo
- mostrar altas, edicion y `DELETE` de usuarios solo para `admin`
- si existe una sola pantalla de usuario para `admin` y `planeador`, dejarla en solo lectura para `planeador`
- al crear o editar usuarios, validar `username` con patron `^[A-Za-z0-9._-]{3,50}$`
- validar `email` antes de enviar
- si se envia `password`, exigir minimo 8 caracteres
- restringir `status` de usuarios a `active` o `inactive`
- tratar `409` como caso esperado al intentar eliminar el propio usuario o uno con `requests` u `orders` asociados
- no esperar que el propio `admin` pueda desactivarse o cambiarse el rol desde la UI actual
- dejar de tratar `clients` como formulario de edicion totalmente libre para `planeador`
- si existe una sola pantalla de edicion de clientes para `admin` y `planeador`, bloquear en UI `name` y `email` cuando el actor sea `planeador`
- ocultar o deshabilitar `DELETE` de clientes para `planeador`
- al crear o editar clientes, restringir `status` a `active` o `inactive`
- validar `email` antes de enviar y, si existe `phone`, exigir formato valido con al menos 7 digitos
- si frontend ofrece eliminar clientes, manejar `409` como caso esperado cuando existan relaciones activas
- dejar de tratar `equipments` como formulario de edicion totalmente libre para `planeador`
- si existe una sola pantalla de edicion de equipos para `admin` y `planeador`, bloquear en UI `name`, `type`, `brand`, `model`, `serial`, `code` y `client` cuando el actor sea `planeador`
- ocultar o deshabilitar `DELETE` de equipos para `planeador`
- al crear o editar equipos, restringir `status` a `active`, `inactive`, `maintenance`, `retired`
- validar en frontend que `use_end_at >= use_start_at` para evitar rechazos `400` evitables
- no enviar `user_created_id` ni `user_updated_id` esperando controlar auditoria
- quitar selects o inputs libres de `status` en `requests`, `orders` y `schedules`
- modelar acciones de negocio como llamados dedicados a `approve`, `cancel`, `assign`, `start`, `complete`, `open` y `close`
- deshabilitar botones de accion cuando el estado actual no permita la transicion para evitar `409`
- tratar `approved`, `completed`, `cancelled` y `closed` como estados de solo lectura en sus formularios de edicion
- consumir listados con `page`, `limit` y `sort`
- leer `meta.pagination` para renderizar paginadores y totales

Cambios que el frontend no necesita hacer:

- no necesita migrar a cookies o sesion server-side
- no necesita usar `username` para login; `email` sigue siendo el contrato preferido
- no necesita crear endpoints nuevos para `users`; el ajuste es de permisos, validacion y comportamiento de UI
- no necesita crear endpoints nuevos para `clients`; el ajuste es de permisos, validacion y comportamiento de UI
- no necesita cambiar payloads de `requests`, `orders` o `schedules` por el hardening reciente
- no necesita crear endpoints nuevos para `equipments`; el ajuste es de permisos, validacion y comportamiento de UI

## Paginacion De Listados

Los endpoints `GET` de coleccion ahora aceptan estos query params:

- `page`: entero positivo, default `1`
- `limit`: entero positivo, default `25`, maximo `100`
- `sort`: `campo:ASC|DESC` o `-campo`

Respuesta esperada:

```json
{
  "status": true,
  "msg": "Obteniendo clientes",
  "clients": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 42,
      "total_pages": 2,
      "returned": 25,
      "has_next_page": true,
      "has_previous_page": false
    },
    "sort": {
      "field": "created_at",
      "direction": "DESC"
    }
  }
}
```

Notas operativas:

- el array principal no cambia: `clients`, `equipments`, `users`, `requests`, `orders`, `schedules`, `roles`, `profiles`
- el frontend debe dejar de asumir respuestas completas sin limite
- si `sort` usa un campo no permitido o `page/limit` son invalidos, el backend responde `400`

## Protocolo De Cambio

1. Cambia modelo, controlador y rutas del backend.
2. Actualiza este documento.
3. Refleja el cambio en `../chillsage-frontend`.
4. Verifica backend y frontend.

## Limitaciones Actuales Del Contrato

- no hay refresh token
- `requests`, `orders`, `schedules`, `equipments`, `clients` y `users` ya no deben tratarse como CRUD libre en frontend aunque sigan exponiendo rutas base
- no existe recurso propio para historial tecnico
- no existe recurso propio para calificacion del servicio
- sigue existiendo borrado fisico como operacion excepcional reservada a `admin`
