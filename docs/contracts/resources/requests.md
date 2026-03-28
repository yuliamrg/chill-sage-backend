# Requests

Fecha de referencia: `2026-03-28`

`requests` representa la necesidad inicial de servicio.

## Endpoints

- `GET /requests`
- `GET /requests/:id`
- `POST /requests`
- `PUT /requests/:id`
- `POST /requests/:id/approve`
- `POST /requests/:id/cancel`
- `DELETE /requests/:id`

## Campos De Lectura

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

## Create

Payload de referencia:

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

## Update

Campos permitidos:

- `client_id`
- `requester_user_id`
- `equipment_id`
- `type`
- `title`
- `description`
- `priority`

Restricciones:

- `PUT` solo edita campos operativos de una solicitud `pending`
- solicitudes `approved` o `cancelled` no se editan por `PUT`
- `status`, `reviewed_at`, `reviewed_by_user_id`, `review_notes` y `cancel_reason` se controlan por acciones explicitas
- frontend no debe renderizar selector libre de `status` para solicitudes

## Estados

- `pending`
- `approved`
- `cancelled`

## Acciones

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

## Filtros De Listado

- `client_id`
- `requester_user_id`
- `equipment_id`
- `status`
- `type`
- `date_from`
- `date_to`

## Reglas De Acceso

- `GET`: `admin`, `planeador`, `tecnico`, `solicitante`
- `POST`: `admin`, `planeador`, `solicitante`
- `PUT`: `admin`, `planeador`
- `approve` y `cancel`: `admin`, `planeador`
- `DELETE`: solo `admin`

## Reglas De Negocio

- el equipo debe pertenecer al cliente indicado
- el solicitante asociado debe existir y estar activo
- `solicitante` solo puede consultar sus solicitudes o las de su cliente
- si la solicitud ya no esta en `pending`, frontend debe tratarla como solo lectura

## Guia De Frontend

- `pending`: permitir `editar`, `approve` y `cancel` segun rol
- `approved`: mostrar datos de revision y habilitar crear orden si el rol lo permite; bloquear `PUT`
- `cancelled`: solo lectura; no ofrecer `approve`, `cancel` ni crear orden
