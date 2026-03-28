# Contrato Frontend - API Actual

Documento de referencia del backend segun el codigo actual del repositorio.

Fecha de referencia: `2026-03-28`

## Alcance

Este documento describe la API real implementada hoy.

Si hay diferencia entre este archivo y los documentos de `docs/context/`, para integrar frontend sobre este backend debes seguir este contrato.

## Navegacion Rapida

Base contractual:

- [Auth y convenciones compartidas](./auth-and-conventions.md)
- [Catalogos base: roles y profiles](./resources/catalogs.md)
- [Users](./resources/users.md)
- [Clients](./resources/clients.md)
- [Equipments](./resources/equipments.md)
- [Requests](./resources/requests.md)
- [Orders](./resources/orders.md)
- [Schedules](./resources/schedules.md)

## Recursos Disponibles

- `users`
- `clients`
- `roles`
- `profiles`
- `equipments`
- `requests`
- `orders`
- `schedules`

Rutas publicas adicionales:

- `POST /users/login`
- `GET /health`

Todos los demas endpoints requieren:

- header `Authorization: Bearer <access_token>`

## Resumen Operativo

- el frontend debe consumir la API desde un origin incluido en `CORS_ORIGINS`
- `POST /users/login` puede responder `429` por rate limiting
- las respuestas `500` ya no exponen detalle tecnico interno
- toda respuesta incluye `X-Request-Id`
- la autenticacion sigue siendo solo por Bearer token en header
- `requests`, `orders` y `schedules` usan endpoints de accion para cambios de estado
- `users`, `clients` y `equipments` ya no deben tratarse como CRUD libre para todos los roles con acceso de lectura

## Matriz Inicial De Acceso

- `admin`: acceso total
- `planeador`: operacion completa sin `DELETE` en recursos operativos
- `tecnico`: lectura operativa y ejecucion de sus ordenes asignadas
- `solicitante`: crear y consultar solicitudes; consultar ordenes dentro de su alcance

Detalle real:

- `users`: lectura `admin`, `planeador`; create/update/delete solo `admin`
- `roles`: `GET` para `admin` y `planeador`; escritura solo `admin`
- `profiles`: `GET` para `admin` y `planeador`; escritura solo `admin`
- `clients`: lectura `admin`, `planeador`, `tecnico`; create/update `admin`, `planeador`; delete solo `admin`
- `equipments`: lectura `admin`, `planeador`, `tecnico`; create/update `admin`, `planeador`; delete solo `admin`
- `requests`: lectura `admin`, `planeador`, `tecnico`, `solicitante`; create `admin`, `planeador`, `solicitante`; update `admin`, `planeador`; approve/cancel `admin`, `planeador`; delete solo `admin`
- `orders`: lectura `admin`, `planeador`, `tecnico`, `solicitante`; create/update/assign/cancel `admin`, `planeador`; start/complete `admin`, `planeador`, `tecnico`; delete solo `admin`
- `schedules`: lectura `admin`, `planeador`, `tecnico`; create/update/open/close `admin`, `planeador`; delete solo `admin`

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

## Paginacion De Listados

Los endpoints `GET` de coleccion aceptan:

- `page`: entero positivo, default `1`
- `limit`: entero positivo, default `25`, maximo `100`
- `sort`: `campo:ASC|DESC` o `-campo`

Respuesta esperada:

```json
{
  "status": true,
  "msg": "Obteniendo clientes",
  "clients": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 42,
      "total_pages": 2,
      "returned": 25,
      "has_next_page": true,
      "has_previous_page": false
    },
    "sort": {
      "field": "created_at",
      "direction": "DESC"
    }
  }
}
```

Notas operativas:

- el array principal no cambia: `clients`, `equipments`, `users`, `requests`, `orders`, `schedules`, `roles`, `profiles`
- el frontend no debe asumir respuestas completas sin limite
- si `sort` usa un campo no permitido o `page/limit` son invalidos, el backend responde `400`

## Impacto En Frontend

Cuando cambie el contrato del backend, revisa como minimo:

- `src/app/core/models/domain.models.ts`
- `src/app/core/mappers/domain.mappers.ts`
- `src/app/core/services/<resource>.service.ts`
- `src/app/features/auth/**`
- formularios de alta y edicion
- listados con filtros operativos
- detalle y acciones de transicion por estado

Checklist de integracion vigente:

- usar `email` como identificador de login
- asegurar que el frontend este incluido en `CORS_ORIGINS`
- manejar `401`, `403`, `409`, `429` y `500` como estados esperados
- no depender de stacks ni mensajes internos para errores `500`
- seguir enviando `Authorization: Bearer <token>` en rutas privadas
- conservar `X-Request-Id` en logs o reportes de error
- quitar selects libres de `status` en `requests`, `orders` y `schedules`
- modelar transiciones con `approve`, `cancel`, `assign`, `start`, `complete`, `open` y `close`
- deshabilitar botones de accion cuando el estado actual no permita la transicion
- consumir listados con `page`, `limit` y `sort`

Detalle por recurso:

- [Users](./resources/users.md)
- [Clients](./resources/clients.md)
- [Equipments](./resources/equipments.md)
- [Requests](./resources/requests.md)
- [Orders](./resources/orders.md)
- [Schedules](./resources/schedules.md)

## Protocolo De Cambio

1. Cambia modelo, controlador y rutas del backend.
2. Actualiza el anexo contractual afectado y este indice si cambia la navegacion.
3. Refleja el cambio en `../chillsage-frontend`.
4. Verifica backend y frontend.

## Limitaciones Actuales Del Contrato

- no hay refresh token
- `requests`, `orders`, `schedules`, `equipments`, `clients` y `users` ya no deben tratarse como CRUD libre en frontend aunque sigan exponiendo rutas base
- no existe recurso propio para historial tecnico
- no existe recurso propio para calificacion del servicio
- sigue existiendo borrado fisico como operacion excepcional reservada a `admin`
