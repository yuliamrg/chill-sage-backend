# Clients

Fecha de referencia: `2026-03-28`

`clients` es un recurso maestro con lectura y actualizacion acotadas por cobertura de cliente.

## Endpoints

- `GET /clients`
- `GET /clients/:id`
- `POST /clients`
- `PUT /clients/:id`
- `DELETE /clients/:id`

## Campos De Lectura

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

## Create

Payload de referencia:

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

## Update

Campos permitidos:

- `name`
- `address`
- `phone`
- `email`
- `description`
- `status`

Restriccion por rol:

- `admin_plataforma` puede editar todos los campos permitidos
- `admin_cliente` y `planeador` solo pueden editar clientes dentro de su cobertura
- `planeador` solo puede editar campos operativos: `address`, `phone`, `description`, `status`
- `planeador` no puede cambiar `name` ni `email`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

## Estados

- `active`
- `inactive`

## Reglas De Acceso

- `GET`: `admin_plataforma`, `admin_cliente`, `planeador`, `tecnico`
- `POST`: solo `admin_plataforma`
- `PUT`: `admin_plataforma`, `admin_cliente`, `planeador`
- `DELETE`: solo `admin_plataforma`

## Reglas De Negocio

- `GET /clients` devuelve solo clientes dentro de cobertura del actor, salvo `admin_plataforma`
- `GET /clients/:id` fuera de cobertura responde `404`
- frontend no debe asumir que `DELETE` siempre depende solo del rol
- un cliente con `users`, `equipments`, `requests`, `orders` o `schedules` asociados responde `409`
