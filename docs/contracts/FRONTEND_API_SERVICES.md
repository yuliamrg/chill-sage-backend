# Contrato Frontend - API Actual

Documento de referencia del backend segun el codigo actual del repositorio.

Fecha de referencia: `2026-03-22`

## Alcance

Este documento describe la API real implementada hoy.

No describe el producto objetivo completo. Para eso existen:

- [Contexto de producto](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
- [Especificacion funcional](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)

Si hay diferencia entre esos documentos y este, para integrar frontend debes seguir este archivo.

## Base URL

```text
http://localhost:<PORT>/api
```

El puerto depende de `PORT` en `.env`. Si no existe, el backend usa `3000`.

## Recursos Disponibles

La API expone hoy:

- `users`
- `clients`
- `roles`
- `profiles`
- `equipments`
- `requests`
- `orders`
- `schedules`

Adicionalmente:

- `POST /users/login`

Todos los demas endpoints requieren:

- header `Authorization: Bearer <access_token>`

## Recursos Que No Existen Todavia

No existen endpoints propios para:

- `auth/refresh`
- `historial`
- `calificaciones`
- `cronogramas-equipos`
- `usuarios-clientes`

Tampoco existen endpoints de negocio como:

- aprobar solicitud
- anular solicitud
- crear orden desde solicitud aprobada
- iniciar orden
- cerrar orden
- cerrar cronograma

Hoy casi todo opera via CRUD generico.

## Estructura Base De Respuesta

La API responde con esta forma:

```json
{
  "status": true,
  "msg": "Mensaje descriptivo",
  "...payload": "datos"
}
```

### Exito con lista

```json
{
  "status": true,
  "msg": "Obteniendo clientes",
  "clients": []
}
```

### Exito con item

```json
{
  "status": true,
  "msg": "Cliente encontrado",
  "client": {}
}
```

### Error con item

```json
{
  "status": false,
  "msg": "Cliente no encontrado",
  "client": null
}
```

## Convenciones

- los listados devuelven una llave plural
- detalle, create, update y delete devuelven una llave singular
- errores de item devuelven la llave singular en `null`
- errores de lista devuelven la llave plural en `[]`

## Endpoints Por Recurso

Todos estos recursos exponen:

- `GET /<resource>`
- `GET /<resource>/:id`
- `POST /<resource>`
- `PUT /<resource>/:id`
- `DELETE /<resource>/:id`

Aplica a:

- `users`
- `clients`
- `roles`
- `profiles`
- `equipments`
- `requests`
- `orders`
- `schedules`

## Llaves De Payload

| Recurso | Llave listado | Llave item |
| --- | --- | --- |
| users | `users` | `user` |
| clients | `clients` | `client` |
| roles | `roles` | `role` |
| profiles | `profiles` | `profile` |
| equipments | `equipments` | `equipment` |
| requests | `requests` | `request` |
| orders | `orders` | `order` |
| schedules | `schedules` | `schedule` |

## Login

Ruta:

- `POST /users/login`

Payload permitido:

```json
{
  "email": "user@example.com",
  "username": "opcional",
  "password": "secret"
}
```

Notas reales:

- devuelve `access_token` JWT Bearer
- no crea sesion persistente server-side
- responde `401` cuando el usuario no existe, la contrasena no coincide o el usuario esta inactivo
- protege el resto de endpoints con middleware de autenticacion
- el campo `password` nunca se devuelve

Respuesta actual:

```json
{
  "status": true,
  "msg": "Inicio de sesion exitoso",
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": "8h",
  "user": {}
}
```

## Roles Base Del Sistema

Bootstrap actual al iniciar el backend:

- `1`: `admin`
- `2`: `solicitante`
- `3`: `planeador`
- `4`: `tecnico`

## Campos Enriquecidos

Algunos recursos agregan campos resueltos por backend para simplificar el frontend.

### users

- `client_name`
- `role_name`

### equipments

- `client_name`

### orders

- `assigned_user_name`
- `request_summary`

Estos campos aparecen en lectura y tambien en respuestas de `create`, `update` y `delete` de esos recursos.

## Campos Reales Por Recurso

### users

- `id`
- `username`
- `name`
- `last_name`
- `email`
- `password` solo entrada
- `client`
- `role`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`
- `client_name` enriquecido
- `role_name` enriquecido

Notas:

- `username` y `email` son unicos
- si no se envia `status`, el backend usa `active`
- si no se envia `role`, el backend usa `2`
- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

### clients

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

Nota:

- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

### roles

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

Nota:

- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

### profiles

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

Nota:

- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

### equipments

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
- `client_name` enriquecido

Nota:

- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

Notas:

- hoy no existe historial tecnico agregado por equipo
- hoy no existe endpoint dedicado con relaciones operativas completas

### requests

- `id`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

Notas:

- si no se envia `status` en create, el backend usa `pending`
- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

Notas importantes:

- la solicitud real del producto deberia tener mas campos
- hoy no hay `type`
- hoy no hay `id_solicitante`
- hoy no hay `id_equipo`
- hoy no hay endpoints de aprobar o anular con reglas de dominio

### orders

- `id`
- `user_assigned_id`
- `request_id`
- `status`
- `start_date`
- `end_date`
- `description`
- `hours`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`
- `assigned_user_name` enriquecido
- `request_summary` enriquecido

Nota:

- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

Notas importantes:

- hoy no existe `received_satisfaction`
- hoy no hay endpoint de cierre de orden
- hoy no hay validacion fuerte del flujo `request -> order`

### schedules

- `id`
- `name`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

Nota:

- `user_created_id` y `user_updated_id` protegidos: salen del usuario autenticado, no del body

Notas importantes:

- `schedules` no representa todavia el cronograma funcional completo esperado por producto
- hoy no hay `client`
- hoy no hay `date`
- hoy no hay `type`
- hoy no hay relacion muchos a muchos con equipos

## Impacto En Frontend

Cuando cambie el contrato del backend, revisa como minimo:

- `src/app/core/models/domain.models.ts`
- `src/app/core/mappers/domain.mappers.ts`
- `src/app/core/services/<resource>.service.ts`
- componentes de lista, detalle, create y edit del modulo afectado

## Protocolo De Cambio

1. Cambia modelo, controlador y rutas del backend.
2. Actualiza este documento.
3. Refleja el cambio en `../chillsage-frontend`.
4. Verifica backend y frontend.

## Matriz Inicial De Acceso

- `admin`: acceso total
- `planeador`: CRUD en `clients`, `equipments`, `requests`, `orders`, `schedules`; lectura en `users`, `roles`, `profiles`
- `tecnico`: lectura en `clients`, `equipments`, `requests`, `orders`, `schedules`
- `solicitante`: `GET` en `requests` y `orders`, `POST` en `requests`

## Limitaciones Actuales Del Contrato

- no hay refresh token
- no hay paginacion
- no hay filtros por query dedicados
- no hay endpoints de negocio; predominan CRUDs directos
- hay borrado fisico de registros
- no hay pruebas automatizadas del backend
