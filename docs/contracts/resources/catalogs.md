# Catalogos Base: Roles Y Profiles

Fecha de referencia: `2026-03-28`

Estos recursos siguen expuestos como catalogos administrativos simples.

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

- `roles`: `GET` para `admin_plataforma`, `admin_cliente`; `POST`, `PUT`, `DELETE` solo `admin_plataforma`
- `profiles`: `GET` para `admin_plataforma`, `admin_cliente`; `POST`, `PUT`, `DELETE` solo `admin_plataforma`

## Roles Base Vigentes

- `admin_plataforma`
- `admin_cliente`
- `planeador`
- `tecnico`
- `solicitante`

## Nota

Este contrato no detalla payloads campo por campo para `roles` ni `profiles` porque siguen un CRUD administrativo simple y no concentran reglas especiales comparables con `users`, `clients`, `equipments`, `requests`, `orders` o `schedules`.
