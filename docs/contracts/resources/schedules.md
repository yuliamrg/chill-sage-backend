# Schedules

Fecha de referencia: `2026-03-28`

`schedules` representa cronogramas por cliente y equipos.

## Endpoints

- `GET /schedules`
- `GET /schedules/:id`
- `POST /schedules`
- `PUT /schedules/:id`
- `POST /schedules/:id/open`
- `POST /schedules/:id/close`
- `DELETE /schedules/:id`

## Campos De Lectura

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

## Create

Payload de referencia:

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

## Update

Campos permitidos:

- `client_id`
- `name`
- `type`
- `scheduled_date`
- `description`
- `equipment_ids` opcional para reemplazar relaciones

Restricciones:

- no se puede editar un cronograma `closed`
- `PUT` no acepta cambios directos de `status`
- frontend no debe exponer selector de estado editable para cronogramas

## Estados

- `unassigned`
- `open`
- `closed`

## Acciones

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

## Filtros De Listado

- `client_id`
- `status`
- `type`
- `date_from`
- `date_to`

## Reglas De Acceso

- `GET`: `admin`, `planeador`, `tecnico`
- `POST`, `PUT`, `open`, `close`: `admin`, `planeador`
- `DELETE`: solo `admin`

## Reglas De Negocio

- exige `client_id`, `name`, `type`, `scheduled_date` y al menos un equipo
- todos los equipos deben existir
- todos los equipos deben pertenecer al mismo cliente
- no acepta equipos en estado `de_baja`, `retirado` o `retired`

## Guia De Frontend

- `unassigned`: permitir `PUT` y accion `open`
- `open`: permitir `PUT` y accion `close`; no ofrecer `open` nuevamente
- `closed`: solo lectura; bloquear `PUT`, `open` y `close`
- no ofrecer `close` directamente desde `unassigned`
