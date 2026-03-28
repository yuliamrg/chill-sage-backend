# Auth Y Convenciones Compartidas

Fecha de referencia: `2026-03-28`

## Base URL

```text
http://localhost:<PORT>/api
```

El puerto depende de `PORT` en `.env`. Si no existe, el backend usa `3000`.

## Auth

Comportamiento real:

- `POST /users/login` es publico
- `GET /health` es publico
- todo el resto de rutas bajo `/api` requiere token Bearer
- sin token valido el backend responde `401`
- con token valido pero sin permiso suficiente responde `403`
- con token valido pero intentando leer un recurso fuera de cobertura el backend suele responder `404`

Roles base actuales:

- `1`: `admin_plataforma`
- `2`: `solicitante`
- `3`: `planeador`
- `4`: `tecnico`
- `5`: `admin_cliente`

## Login

Ruta:

- `POST /users/login`

Payload de frontend:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Notas reales:

- devuelve `access_token` JWT Bearer
- no crea sesion persistente server-side
- frontend debe autenticarse con `email` y `password`
- backend tambien acepta `username` como compatibilidad legacy
- `username` debe tratarse como compatibilidad legacy del backend, no como contrato vigente para frontend
- responde `400` si falta `password` o faltan `email` y `username`
- responde `401` si el usuario no existe, esta inactivo o la contrasena no coincide
- responde `429` si excede el limite configurado de intentos fallidos
- el campo `password` nunca se devuelve

Respuesta actual:

```json
{
  "status": true,
  "msg": "Inicio de sesion exitoso",
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": "8h",
  "user": {
    "id": 3,
    "username": "planner.norte",
    "email": "planner.norte@example.com",
    "role": 3,
    "role_name": "planeador",
    "primary_client_id": 1,
    "primary_client_name": "Cliente Norte",
    "client_ids": [1, 2],
    "all_clients": false,
    "clients": []
  }
}
```

## Cobertura Por Cliente

- `admin_plataforma` tiene acceso global
- `admin_cliente`, `planeador`, `tecnico` y `solicitante` operan con `primary_client_id`, `client_ids` y `all_clients`
- `all_clients=true` habilita acceso total a clientes
- si `all_clients=false`, la cobertura efectiva son los `client_ids`
- cualquier usuario no plataforma requiere `primary_client_id`
- cuando una accion operativa no envia `client_id`, el backend intenta usar `primary_client_id`
- si el usuario no tiene cliente primario valido, la accion responde `400`

## Compatibilidad Operativa Para Frontend Web

- el frontend debe consumir la API desde un origin incluido en `CORS_ORIGINS`
- en desarrollo con Angular CLI eso normalmente implica `http://localhost:4200` y `http://127.0.0.1:4200`
- `POST /users/login` puede responder `429` por rate limiting
- las respuestas `500` ya no deben asumirse con detalle tecnico interno
- toda respuesta incluye header `X-Request-Id`
- el cliente puede enviar `X-Request-Id` y el backend lo reutiliza en la respuesta
- la autenticacion sigue siendo solo por token Bearer en header; no hay cookies ni refresh token

Checklist minima para frontend:

- configurar `VITE_API_URL` o equivalente contra el backend correcto
- alinear el origin del frontend con `CORS_ORIGINS`
- manejar `401`, `403`, `404`, `409`, `429` y `500` como estados esperados del contrato
- no depender de mensajes de error internos ni de stacks
- conservar `X-Request-Id` en logs del frontend o reportes de error si existe
- persistir `role_name`, `primary_client_id`, `client_ids` y `all_clients` del usuario autenticado

## Estructura Base De Respuesta

La API responde con esta forma:

```json
{
  "status": true,
  "msg": "Mensaje descriptivo",
  "...payload": "datos"
}
```

Exito con lista:

```json
{
  "status": true,
  "msg": "Obteniendo solicitudes",
  "requests": []
}
```

Exito con item:

```json
{
  "status": true,
  "msg": "Orden encontrada",
  "order": {}
}
```

Error tipico:

```json
{
  "status": false,
  "msg": "Solicitud no encontrada",
  "request": null
}
```

Error de rate limiting en login:

```json
{
  "status": false,
  "msg": "Demasiados intentos de inicio de sesion. Intenta nuevamente mas tarde",
  "user": null
}
```

Error `500` endurecido:

```json
{
  "status": false,
  "msg": "Unexpected server error"
}
```

Header de correlacion:

```text
X-Request-Id: <uuid-o-id-propagado>
```

## Convenciones

- los listados devuelven una llave plural
- detalle, create, update, action y delete devuelven una llave singular
- errores de item suelen devolver la llave singular en `null`
- errores de lista suelen devolver la llave plural en `[]`
- conflictos de dominio usan `409`
- falta de autenticacion usa `401`
- falta de permiso usa `403`
- intento de detalle fuera de cobertura puede responder `404`
- rate limit de login usa `429`
- en `requests`, `orders` y `schedules` el frontend no debe intentar cambiar `status` por `PUT`
- las transiciones de negocio viven en endpoints de accion dedicados
