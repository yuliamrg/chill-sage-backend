# Users

Fecha de referencia: `2026-03-28`

`users` es un recurso administrativo con alcance por cliente. Ya no debe tratarse como CRUD libre ni como catalogo global para cualquier rol con lectura.

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
- `role`
- `role_name`
- `status`
- `primary_client_id`
- `primary_client_name`
- `client_ids`
- `all_clients`
- `clients`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

`clients` se devuelve como arreglo resumido:

```json
[
  {
    "id": 1,
    "name": "Cliente Norte"
  }
]
```

## Create

Payload de referencia:

```json
{
  "username": "planner.norte",
  "name": "Paula",
  "last_name": "Lopez",
  "email": "paula.lopez@example.com",
  "password": "Passw0rd!",
  "primary_client_id": 1,
  "client_ids": [1, 2],
  "all_clients": false,
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
- `role` debe referenciar un rol existente
- `status` solo acepta `active` o `inactive`
- `username` y `email` deben ser unicos; colisiones responden `409`
- `user_created_id` enviado por frontend se ignora; auditoria la define el backend
- el campo `password` nunca se devuelve en respuestas

Reglas de cobertura:

- `admin_plataforma` no debe tener `primary_client_id`, `client_ids` ni `all_clients`
- cualquier usuario no plataforma requiere `primary_client_id`
- si `all_clients=false`, el usuario requiere al menos un `client_id` asociado
- si `all_clients=false`, `primary_client_id` debe pertenecer a `client_ids`
- todos los `client_ids` deben existir

## Update

Campos permitidos:

- `username`
- `name`
- `last_name`
- `email`
- `password`
- `primary_client_id`
- `client_ids`
- `all_clients`
- `role`
- `status`

Reglas:

- `admin_plataforma` puede crear, editar y eliminar cualquier usuario
- `admin_cliente` puede crear, editar y eliminar solo usuarios cuya cobertura final sea subconjunto de su propia cobertura
- `admin_cliente` no puede crear ni gestionar `admin_plataforma`
- `planeador` conserva solo lectura
- el propio usuario autenticado no puede cambiar su `role`
- el propio usuario autenticado no puede cambiar su `status`
- `user_updated_id` enviado por frontend se ignora; auditoria la define el backend

## Estados

- `active`
- `inactive`

## Reglas De Acceso

- `GET`: `admin_plataforma`, `admin_cliente`, `planeador`
- `POST`: `admin_plataforma`, `admin_cliente`
- `PUT`: `admin_plataforma`, `admin_cliente`
- `DELETE`: `admin_plataforma`, `admin_cliente`

## Reglas De Negocio

- `GET /users` y `GET /users/:id` respetan cobertura por cliente
- un `admin_cliente` no ve ni administra usuarios fuera de su cobertura
- un `admin_cliente` no ve ni administra `admin_plataforma`
- un usuario no puede eliminarse a si mismo; responde `409`
- un usuario con `requests` creadas, `requests` revisadas u `orders` asignadas responde `409`
- si un usuario no plataforma queda sin cobertura valida, frontend debe tratarlo como configuracion invalida y corregirlo via administracion

## Guia De Frontend

- modelar `primary_client_id`, `client_ids` y `all_clients` como parte del formulario y del estado autenticado
- `admin_plataforma`: mostrar formulario completo y selector libre de roles
- `admin_cliente`: ocultar o bloquear opcion `admin_plataforma`
- `planeador`: mantener listados y detalle en solo lectura
- ocultar `create`, `edit` y `DELETE` para cualquier rol distinto de `admin_plataforma` o `admin_cliente`
