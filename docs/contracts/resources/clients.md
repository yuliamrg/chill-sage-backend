# Clients

Fecha de referencia: `2026-03-28`

`clients` sigue siendo un recurso maestro, pero ya no debe tratarse como CRUD totalmente libre para `planeador`.

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

- `admin` puede editar todos los campos permitidos
- `planeador` solo puede editar campos operativos: `address`, `phone`, `description`, `status`
- `planeador` no puede cambiar datos maestros base: `name`, `email`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

## Estados

- `active`
- `inactive`

## Reglas De Acceso

- `GET`: `admin`, `planeador`, `tecnico`
- `POST`: `admin`, `planeador`
- `PUT`: `admin`, `planeador`
- `DELETE`: solo `admin`

## Reglas De Negocio

- frontend no debe asumir que `DELETE` siempre depende solo del rol
- un cliente con `users`, `equipments`, `requests`, `orders` o `schedules` asociados responde `409`
- si frontend ofrece accion de eliminacion, debe reservarla para clientes huerfanos o manejar el `409` con mensaje claro
