# Equipments

Fecha de referencia: `2026-03-28`

`equipments` sigue siendo un recurso administrativo, pero ya no debe tratarse como CRUD libre en frontend.

## Endpoints

- `GET /equipments`
- `GET /equipments/:id`
- `POST /equipments`
- `PUT /equipments/:id`
- `DELETE /equipments/:id`

## Campos De Lectura

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

## Create

Payload de referencia:

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

## Update

Campos permitidos:

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

## Estados

- `active`
- `inactive`
- `maintenance`
- `retired`

## Reglas De Acceso

- `GET`: `admin`, `planeador`, `tecnico`
- `POST`: `admin`, `planeador`
- `PUT`: `admin`, `planeador`
- `DELETE`: solo `admin`

## Reglas De Negocio

- `planeador` puede mantener datos operativos del equipo, pero no redefinir identidad maestra
- `tecnico` conserva acceso de lectura; no tiene permisos de escritura
- el frontend no debe asumir que todo `PUT /equipments/:id` permitido por rol puede mutar cualquier campo

## Guia De Frontend

- `admin`: mostrar formulario completo de alta y edicion
- `planeador`: mostrar formulario parcial o campos bloqueados para datos maestros base
- `tecnico`: detalle y listados en solo lectura
- ocultar `DELETE` para cualquier rol distinto de `admin`
