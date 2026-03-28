# Revision Tecnica

Revision estatica actualizada sobre el estado real del backend en `2026-03-28`.

## Resumen Ejecutivo

El backend ya no debe describirse como base CRUD simple. Hoy existe:

- flujo operativo implementado para `requests`, `orders` y `schedules`
- autenticacion JWT Bearer y autorizacion por rol
- aislamiento multi-cliente con `primary_client_id`, `client_ids` y `all_clients`
- administracion separada entre `admin_plataforma` y `admin_cliente`
- paginacion uniforme, migraciones versionadas y observabilidad minima util

La documentacion de `docs/context/` sigue siendo objetivo de producto, no estado implementado.

## Estado Real Del Backend

### Resuelto

- `POST /api/users/login` y `GET /api/health` publicos; el resto de `/api` requiere Bearer token
- roles base: `admin_plataforma`, `admin_cliente`, `planeador`, `tecnico`, `solicitante`
- cobertura por cliente aplicada en `users`, `clients`, `equipments`, `requests`, `orders` y `schedules`
- `404` para detalle fuera de cobertura y `403` para filtros explicitos fuera de alcance en recursos operativos
- flujo de negocio con endpoints de accion dedicados en `requests`, `orders` y `schedules`
- validaciones de dominio y consistencia de cliente en recursos operativos
- CORS por `CORS_ORIGINS`, rate limiting en login y respuestas `500` endurecidas
- `X-Request-Id`, logs JSON basicos y `schema_migrations`
- suite de integracion sobre auth, autorizacion, paginacion, hardening, migraciones y recursos principales

### Lo Que No Debe Inferirse

- `docs/context/` no implica que existan ya `historial tecnico` o `calificacion del servicio`
- el backend no expone refresh token ni autenticacion por cookies
- `requests`, `orders` y `schedules` no deben tratarse como CRUD libre aunque tengan rutas base

## Brechas Vigentes

Las brechas tecnicas que siguen siendo razonables hoy ya viven en `docs/engineering/HARDENING_PLAN.md`. Este documento no debe duplicar backlog de endurecimiento ni roadmap funcional.

En terminos practicos, lo pendiente con impacto real es:

- decidir politica de secretos si el repo se va a compartir fuera del equipo
- rechazar campos desconocidos en payloads en lugar de filtrarlos en silencio
- ampliar pruebas negativas utiles y automatizar `pnpm test` en CI

## Regla De Uso

- usa `docs/contracts/` como contrato HTTP vigente
- usa `docs/engineering/CANONICAL_SCHEMA.md` como fuente de verdad de persistencia
- usa `docs/context/` solo como objetivo de producto o backlog funcional
