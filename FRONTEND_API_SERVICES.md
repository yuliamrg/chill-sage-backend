# Guia de Integracion Frontend con la API Actual

Documento de referencia del backend segun el codigo actual.

Fecha de referencia: 2026-03-20

## Uso de este documento

Este archivo es el contrato operativo entre:

- backend: `../chillsage-backend`
- frontend: `../chillsage-frontend`

Regla:

- Si cambias campos, llaves, endpoints o relaciones enriquecidas en backend, debes actualizar este documento en el mismo cambio.
- Despues de actualizar este documento, debes reflejar el cambio en el frontend antes de considerar terminado el trabajo.

## Donde se refleja un cambio en frontend

Cuando cambie el contrato del backend, revisa como minimo estos archivos del frontend:

- `src/app/core/models/domain.models.ts`
- `src/app/core/mappers/domain.mappers.ts`
- `src/app/core/services/<resource>.service.ts`
- componentes de lista, detalle, create y edit del recurso

## Protocolo de cambio de contrato

Aplica este flujo para cualquier recurso, por ejemplo `requests`:

1. Actualiza modelo, controlador y rutas del backend.
2. Actualiza este documento:
   - campos de entrada,
   - campos de salida,
   - llaves de respuesta,
   - campos enriquecidos,
   - ejemplos si cambiaron.
3. Actualiza frontend:
   - `domain.models.ts` para el shape de UI,
   - `domain.mappers.ts` para mapear API -> VM y Form -> API,
   - `<resource>.service.ts` si cambia endpoint o payload,
   - formularios/listados si el campo se captura o se presenta.
4. Verifica:
   - backend con arranque local o `node --check`,
   - frontend con `npm run build`.

## Matriz de impacto rapido

| Cambio en backend | Impacto obligatorio en frontend |
| --- | --- |
| Agregar campo de salida | agregar propiedad en VM y mapearla en `map<Resource>` |
| Agregar campo de entrada | agregar control en formulario y mapearlo en `map<Resource>FormToApi` |
| Renombrar campo | actualizar mapper, modelos y componentes que lo usan |
| Eliminar campo | quitarlo de VM, mappers, formularios, tablas y detalle |
| Cambiar llave de respuesta | actualizar `<resource>.service.ts` |
| Agregar campo enriquecido | mapearlo y mostrarlo donde la UI lo necesite |

## Ejemplo: cambio en solicitudes

Si el controlador de `requests` agrega, elimina o renombra campos:

1. Actualiza la seccion `requests` de este documento.
2. Cambia `RequestVm` y `RequestFormValue` en `../chillsage-frontend/src/app/core/models/domain.models.ts`.
3. Cambia `mapRequest` y `mapRequestFormToApi` en `../chillsage-frontend/src/app/core/mappers/domain.mappers.ts`.
4. Ajusta `../chillsage-frontend/src/app/core/services/requests.service.ts` si cambia el endpoint o la llave `request/requests`.
5. Ajusta los componentes bajo `../chillsage-frontend/src/app/features/requests/`.

Sin ese recorrido, el cambio queda incompleto aunque ambos proyectos sigan levantando.

## Base URL

La API expone sus rutas bajo:

```text
http://localhost:<PORT>/api
```

Valor actual en este proyecto:

```text
http://localhost:3037/api
```

El puerto real depende de `PORT` en `.env`. Si no existe, el backend usa `3000`.

## Contrato unificado de respuestas

Todas las respuestas JSON del backend siguen ahora esta estructura base:

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

### Error con lista

```json
{
  "status": false,
  "msg": "Error al conectar con el controlador client: ...",
  "clients": []
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

## Convenciones por recurso

- Los endpoints de listado devuelven una llave plural.
- Los endpoints `getById`, `create`, `update` y `delete` devuelven una llave singular.
- En errores de item, la llave singular llega como `null`.
- En errores de lista, la llave plural llega como `[]`.

## Recursos disponibles

Todos estos recursos tienen contrato CRUD consistente:

- `users`
- `clients`
- `roles`
- `schedules`
- `requests`
- `profiles`
- `orders`
- `equipments`

### Endpoints por recurso

Para cada recurso anterior existen:

- `GET /<resource>`
- `GET /<resource>/:id`
- `POST /<resource>`
- `PUT /<resource>/:id`
- `DELETE /<resource>/:id`

Excepcion adicional:

- `POST /users/login`

## Llaves reales por recurso

| Recurso | Llave listado | Llave item |
| --- | --- | --- |
| users | `users` | `user` |
| clients | `clients` | `client` |
| roles | `roles` | `role` |
| schedules | `schedules` | `schedule` |
| requests | `requests` | `request` |
| profiles | `profiles` | `profile` |
| orders | `orders` | `order` |
| equipments | `equipments` | `equipment` |

## Login

Ruta:

- `POST /users/login`

Payload esperado:

```json
{
  "email": "usuario@correo.com",
  "password": "secreta"
}
```

Tambien puede enviarse `username` en lugar de `email`.

Respuesta exitosa:

```json
{
  "status": true,
  "msg": "Inicio de sesion exitoso",
  "user": {}
}
```

Respuesta de error:

```json
{
  "status": false,
  "msg": "Usuario no encontrado",
  "user": null
}
```

Notas:

- No se entrega token.
- Las credenciales invalidas responden `401`.
- El campo `password` nunca se devuelve.

## Campos enriquecidos

Algunos recursos incluyen campos adicionales resueltos por backend para uso directo en UI.

### users

Lectura y mutaciones devuelven:

- `client_name`
- `role_name`

### orders

Lectura y mutaciones devuelven:

- `assigned_user_name`
- `request_summary`

### equipments

Lectura y mutaciones devuelven:

- `client_name`

Esto aplica a:

- `GET /resource`
- `GET /resource/:id`
- `POST /resource`
- `PUT /resource/:id`
- `DELETE /resource/:id`

## Campos esperados por recurso

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
- `client_name`
- `role_name`
- `user_created_id`
- `user_updated_id`

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

### roles

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### schedules

- `id`
- `name`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### requests

- `id`
- `description`
- `status`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### profiles

- `id`
- `description`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

### orders

- `id`
- `user_assigned_id`
- `assigned_user_name`
- `request_id`
- `request_summary`
- `status`
- `start_date`
- `end_date`
- `description`
- `hours`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

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
- `client_name`
- `description`
- `status`
- `use_start_at`
- `use_end_at`
- `created_at`
- `updated_at`
- `user_created_id`
- `user_updated_id`

## Recomendaciones para el frontend

- Centraliza `baseURL` y no la hardcodees por pantalla.
- Usa siempre `msg` como mensaje principal de backend.
- Trata `status === false` como fallo de negocio o de transporte aun si la forma del payload ya es conocida.
- Para listas, consume la llave plural del recurso.
- Para detalle y mutaciones, consume la llave singular del recurso.

## Ejemplos de consumo

### GET /clients

```ts
const response = await http.get('/clients')
const clients = response.clients
```

### GET /clients/1

```ts
const response = await http.get('/clients/1')
const client = response.client
```

### POST /users

```ts
const response = await http.post('/users', payload)
const user = response.user
```

## Limitaciones actuales

- No hay autenticacion basada en token.
- No hay paginacion.
- No hay filtros dedicados por query en los CRUD.
- No existe un formato RFC estandar de errores; el contrato es uniforme dentro del proyecto, no un estandar externo.
- No hay pruebas automatizadas del backend.
