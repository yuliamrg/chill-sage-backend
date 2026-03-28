# Orders

Fecha de referencia: `2026-03-28`

`orders` representa la ejecucion tecnica derivada de una solicitud aprobada.

## Endpoints

- `GET /orders`
- `GET /orders/:id`
- `POST /orders`
- `PUT /orders/:id`
- `POST /orders/:id/assign`
- `POST /orders/:id/start`
- `POST /orders/:id/complete`
- `POST /orders/:id/cancel`
- `DELETE /orders/:id`

## Campos De Lectura

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

## Create

Payload de referencia:

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

## Update

Campos permitidos:

- `assigned_user_id`
- `planned_start_at`
- `diagnosis`
- `closure_notes`
- `received_satisfaction`

Restricciones:

- no se puede editar una orden `completed` o `cancelled`
- `PUT` no acepta cambios de `status` ni campos propios de `start`, `complete` o `cancel`
- frontend no debe usar `PUT` para simular `assign`, `start`, `complete` o `cancel`

## Estados

- `assigned`
- `in_progress`
- `completed`
- `cancelled`

## Acciones

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

## Filtros De Listado

- `client_id`
- `equipment_id`
- `assigned_user_id`
- `status`
- `type`
- `date_from`
- `date_to`

## Reglas De Acceso

- `GET`: `admin`, `planeador`, `tecnico`, `solicitante`
- `POST`, `PUT`, `assign`, `cancel`: `admin`, `planeador`
- `start`, `complete`: `admin`, `planeador`, `tecnico`
- `DELETE`: solo `admin`

## Reglas De Negocio

- solo se crea desde una `request` en `approved`
- una `request` no puede tener mas de una `order` activa
- `tecnico` solo puede consultar sus ordenes asignadas
- `solicitante` solo puede consultar ordenes derivadas de sus solicitudes o de su cliente
- `cancel` solo aplica sobre ordenes `assigned` o `in_progress`

## Guia De Frontend

- `assigned`: permitir `assign`, `start`, `cancel` y edicion administrativa por `PUT`
- `in_progress`: permitir `complete` y `cancel`; bloquear `assign` y evitar editar campos de cierre por `PUT`
- `completed`: solo lectura; no ofrecer `PUT`, `assign`, `start`, `complete` ni `cancel`
- `cancelled`: solo lectura; no ofrecer acciones adicionales
- si el actor es `tecnico`, solo mostrar `start` y `complete` cuando la orden este asignada a ese mismo tecnico
