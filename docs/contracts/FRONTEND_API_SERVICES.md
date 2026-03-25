# Contrato Frontend - API Actual

Documento de referencia del backend segun el codigo actual del repositorio.

Fecha de referencia: `2026-03-24`

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

Todos los demas endpoints requieren:

- header `Authorization: Bearer <access_token>`

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

## Convenciones

- los listados devuelven una llave plural
- detalle, create, update, action y delete devuelven una llave singular
- errores de item suelen devolver la llave singular en `null`
- errores de lista suelen devolver la llave plural en `[]`
- conflictos de dominio usan `409`
- falta de autenticacion usa `401`
- falta de permiso usa `403`
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

- `users`
- `clients`
- `roles`
- `profiles`
- `equipments`

Rutas base:

- `GET /<resource>`
- `GET /<resource>/:id`
- `POST /<resource>`
- `PUT /<resource>/:id`
- `DELETE /<resource>/:id`

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

- `users`: `GET` para `admin` y `planeador`; escritura solo `admin`
- `roles`: `GET` para `admin` y `planeador`; escritura solo `admin`
- `profiles`: `GET` para `admin` y `planeador`; escritura solo `admin`
- `clients`: lectura `admin`, `planeador`, `tecnico`; escritura `admin`, `planeador`
- `equipments`: lectura `admin`, `planeador`, `tecnico`; escritura `admin`, `planeador`
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
- quitar selects o inputs libres de `status` en `requests`, `orders` y `schedules`
- modelar acciones de negocio como llamados dedicados a `approve`, `cancel`, `assign`, `start`, `complete`, `open` y `close`
- deshabilitar botones de accion cuando el estado actual no permita la transicion para evitar `409`
- tratar `approved`, `completed`, `cancelled` y `closed` como estados de solo lectura en sus formularios de edicion

## Protocolo De Cambio

1. Cambia modelo, controlador y rutas del backend.
2. Actualiza este documento.
3. Refleja el cambio en `../chillsage-frontend`.
4. Verifica backend y frontend.

## Limitaciones Actuales Del Contrato

- no hay refresh token
- no hay paginacion
- `requests`, `orders` y `schedules` ya tienen filtros, acciones de dominio y politicas centralizadas; otros modulos siguen mayormente CRUD
- no existe recurso propio para historial tecnico
- no existe recurso propio para calificacion del servicio
- sigue existiendo borrado fisico como operacion excepcional reservada a `admin`
