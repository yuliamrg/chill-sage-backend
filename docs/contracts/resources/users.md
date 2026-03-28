# Users

Fecha de referencia: `2026-03-28`

`users` sigue siendo un recurso maestro administrativo, pero ya no debe tratarse como CRUD completamente libre solo porque mantenga rutas base.

## Endpoints

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

## Campos De Lectura

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

## Create

Payload de referencia:

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

## Update

Campos permitidos:

- `username`
- `name`
- `last_name`
- `email`
- `password`
- `client`
- `role`
- `status`

Reglas:

- solo `admin` puede crear, editar o eliminar usuarios
- `planeador` conserva solo lectura
- el propio `admin` autenticado no puede cambiar su `role`
- el propio `admin` autenticado no puede cambiar su `status`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

## Estados

- `active`
- `inactive`

## Reglas De Acceso

- `GET`: `admin`, `planeador`
- `POST`: solo `admin`
- `PUT`: solo `admin`
- `DELETE`: solo `admin`

## Reglas De Negocio

- el frontend no debe asumir que `DELETE` depende solo del rol
- un usuario no puede eliminarse a si mismo; responde `409`
- un usuario con `requests` creadas, `requests` revisadas u `orders` asignadas responde `409`
- si frontend ofrece rotacion de password, debe tratarla como cambio sensible solo para `admin`

## Guia De Frontend

- `admin`: mostrar formulario completo de alta y edicion
- `planeador`: mantener listados y detalle en solo lectura
- ocultar `create`, `edit` y `DELETE` para cualquier rol distinto de `admin`
- si existe una sola pantalla de detalle para `admin` y `planeador`, dejar todos los controles bloqueados cuando el actor no sea `admin`
