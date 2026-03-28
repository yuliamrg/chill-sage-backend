# Esquema Canonico

Este documento define el esquema oficial de base de datos que el backend actual considera canonico.

## Regla Base

- el esquema oficial usa nombres de tablas y columnas en ingles
- las tablas en espanol se consideran legado y no deben reutilizarse
- cualquier cambio nuevo de backend debe extender este esquema, no recrear variantes paralelas

## Tablas Canonicas

### Auth y maestros base

- `users`
- `roles`
- `profiles`
- `clients`
- `user_client_scopes`
- `equipments`

### Flujo operativo

- `requests`
- `orders`
- `schedules`
- `schedule_equipments`

## Relacion Conceptual

- `users.role -> roles.id`
- `users.client -> clients.id`
- `users.all_clients -> boolean`
- `user_client_scopes.user_id -> users.id`
- `user_client_scopes.client_id -> clients.id`
- `equipments.client -> clients.id`
- `requests.client_id -> clients.id`
- `requests.requester_user_id -> users.id`
- `requests.equipment_id -> equipments.id`
- `orders.request_id -> requests.id`
- `orders.client_id -> clients.id`
- `orders.equipment_id -> equipments.id`
- `orders.user_assigned_id -> users.id`
- `schedules.client_id -> clients.id`
- `schedule_equipments.schedule_id -> schedules.id`
- `schedule_equipments.equipment_id -> equipments.id`

## Modelo De Cobertura

- `users.client` se conserva como cliente primario persistente
- `user_client_scopes` es la tabla canonica de cobertura multi-cliente
- `users.all_clients=true` concede acceso total por cliente al usuario
- `admin_plataforma` es el unico rol que puede existir sin cobertura por cliente

## Equivalencias Con Legado

Las siguientes tablas en espanol existieron como esquema previo o de documentacion historica:

| Canonica | Legado |
| --- | --- |
| `users` | `usuarios` |
| `clients` | `clientes` |
| `user_client_scopes` | `usuarios_clientes` |
| `equipments` | `equipos` |
| `requests` | `solicitudes` |
| `orders` | `ordenes_trabajo` |
| `schedules` | `cronogramas` |
| `schedule_equipments` | `cronogramas_equipos` |

Tambien existieron tablas legacy sin integracion actual en el backend:

- `calificaciones_servicio`
- `brands`

## Criterio Operativo

- si una tabla no esta en la lista canonica, no debe asumirse como parte del contrato real del backend
- si una necesidad de producto futura requiere relaciones adicionales, deben modelarse sobre el esquema canonico en ingles
- la documentacion de producto puede seguir hablando en terminos funcionales en espanol, pero la implementacion persistente oficial queda en ingles
