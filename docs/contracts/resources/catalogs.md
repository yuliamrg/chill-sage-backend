# Catalogos Base: Roles Y Profiles

Fecha de referencia: `2026-03-28`

Estos recursos siguen expuestos principalmente como CRUD basico.

## Endpoints Base

- `GET /roles`
- `GET /roles/:id`
- `POST /roles`
- `PUT /roles/:id`
- `DELETE /roles/:id`
- `GET /profiles`
- `GET /profiles/:id`
- `POST /profiles`
- `PUT /profiles/:id`
- `DELETE /profiles/:id`

## Acceso

- `roles`: `GET` para `admin`, `planeador`; `POST`, `PUT`, `DELETE` solo `admin`
- `profiles`: `GET` para `admin`, `planeador`; `POST`, `PUT`, `DELETE` solo `admin`

## Nota

Este contrato no detalla payloads campo por campo para `roles` ni `profiles` porque siguen un CRUD administrativo simple y no concentran reglas especiales comparables con `users`, `clients`, `equipments`, `requests`, `orders` o `schedules`.
