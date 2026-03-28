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
- `equipment_ids`

Restricciones:

- no se puede editar un cronograma `closed`
- `PUT` no acepta cambios directos de `status`
- frontend no debe exponer selector de estado editable para cronogramas

## Estados

- `unassigned`
- `open`
- `closed`

## Acciones

- `POST /schedules/:id/open`
- `POST /schedules/:id/close`

## Filtros De Listado

- `client_id`
- `status`
- `type`
- `date_from`
- `date_to`

## Reglas De Acceso

- `GET`: `admin_plataforma`, `admin_cliente`, `planeador`, `tecnico`
- `POST`, `PUT`, `open`, `close`: `admin_plataforma`, `admin_cliente`, `planeador`
- `DELETE`: `admin_plataforma`, `admin_cliente`

## Reglas De Negocio

- exige `client_id`, `name`, `type`, `scheduled_date` y al menos un equipo
- todos los equipos deben existir
- todos los equipos deben pertenecer al mismo cliente
- no acepta equipos en estado `de_baja`, `retirado` o `retired`
- `GET /schedules` devuelve solo cronogramas dentro de cobertura
- el filtro `?client_id=` fuera de cobertura responde `403`
- `GET /schedules/:id` fuera de cobertura responde `404`
