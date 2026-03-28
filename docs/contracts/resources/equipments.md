# Equipments

Fecha de referencia: `2026-03-28`

`equipments` es un recurso administrativo con alcance por cliente.

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
  "status": "active"
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

- `admin_plataforma` y `admin_cliente` pueden editar equipos dentro de su cobertura
- `planeador` solo puede editar campos operativos: `location`, `alias`, `description`, `status`, `use_start_at`, `use_end_at`
- `planeador` no puede cambiar datos maestros base: `name`, `type`, `brand`, `model`, `serial`, `code`, `client`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

## Estados

- `active`
- `inactive`
- `maintenance`
- `retired`

## Reglas De Acceso

- `GET`: `admin_plataforma`, `admin_cliente`, `planeador`, `tecnico`
- `POST`: `admin_plataforma`, `admin_cliente`, `planeador`
- `PUT`: `admin_plataforma`, `admin_cliente`, `planeador`
- `DELETE`: `admin_plataforma`, `admin_cliente`

## Reglas De Negocio

- `GET /equipments` devuelve solo equipos dentro de cobertura
- el filtro `?client=` fuera de cobertura responde `403`
- `GET /equipments/:id` fuera de cobertura responde `404`
- `planeador` puede mantener datos operativos, pero no redefinir identidad maestra
- `tecnico` conserva acceso de lectura; no tiene permisos de escritura
