# Contexto Para Codex

Documento de entrada rapida para agentes trabajando en este repo.

## Que Es Este Repo

Backend Node.js con `Express` y `Sequelize` para ChillSage.

El codigo actual implementa un backend mixto:

- CRUD administrativo estable para catalogos y maestros
- flujo operativo real para `requests`, `orders` y `schedules`

No existe todavia el dominio completo del producto, pero la operacion principal ya no debe leerse como CRUD generico.

## Fuente De Verdad Por Tema

- producto objetivo: [context/CONTEXTO_PRODUCTO_CHILLSAGE.md](./context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
- especificacion funcional: [context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](./context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)
- contrato backend/frontend real: [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md)
- revision de brechas y riesgos: [engineering/REVIEW.md](./engineering/REVIEW.md)
- reglas de proceso: [process/GIT_RULES.md](./process/GIT_RULES.md)

## Como Leer El Proyecto

1. Leer este archivo.
2. Leer [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md) para entender la API real.
3. Leer [engineering/REVIEW.md](./engineering/REVIEW.md) para entender lo que aun falta.
4. Solo despues usar `context/` para orientar cambios de producto o cerrar brechas.

## Arquitectura Real

```text
index.js
src/
  app.js
  auth/
  controllers/
  models/
  routes/
  utils/
tests/
  helpers/
  integration/
```

Patron dominante actual:

- rutas por recurso
- controladores HTTP con reglas de negocio embebidas
- politicas de dominio compartidas para `requests`, `orders` y `schedules`
- modelos Sequelize sin una capa de servicios completa para todo el sistema
- enriquecimientos manuales para frontend
- tests de integracion HTTP para contrato y permisos

## Arranque Real

`pnpm start` hoy hace solo lo necesario para servir la API:

- autentica conexion a MySQL
- inicializa asociaciones Sequelize
- valida configuracion JWT
- aplica CORS restringido por `CORS_ORIGINS`
- aplica rate limiting a `POST /api/users/login`
- levanta Express

No ejecuta bootstrap de esquema, roles ni usuarios de prueba.

Cuando eso se requiere, el repo expone scripts manuales:

- `pnpm run db:migrate`
- `pnpm run db:ensure-schema` como alias legacy
- `pnpm run db:bootstrap-auth`

## Restricciones Reales Del Codigo

- hay autenticacion JWT Bearer
- hay autorizacion por rol en rutas
- no hay refresh token ni sesion server-side
- hay paginacion uniforme en listados con `page`, `limit`, `sort` y `meta`
- no hay historial tecnico ni calificaciones como recursos propios
- existe borrado fisico, pero en recursos operativos queda restringido a `admin`

## Estado Operativo Implementado

### Requests

- estados: `pending`, `approved`, `cancelled`
- filtros por `client_id`, `requester_user_id`, `equipment_id`, `status`, `type`, `date_from`, `date_to`
- ownership parcial para `solicitante`
- endpoints de accion: `approve` y `cancel`
- `PUT` no cambia estado y solicitudes no `pending` deben tratarse como solo lectura

### Orders

- estados: `assigned`, `in_progress`, `completed`, `cancelled`
- solo se crea desde `request` aprobada
- filtros por `client_id`, `equipment_id`, `assigned_user_id`, `status`, `type`, `date_from`, `date_to`
- endpoints de accion: `assign`, `start`, `complete`, `cancel`
- tecnico asignado puede iniciar y completar su propia orden
- `PUT` no reemplaza endpoints de accion

### Schedules

- estados: `unassigned`, `open`, `closed`
- filtros por `client_id`, `status`, `type`, `date_from`, `date_to`
- relacion real `schedule_equipments`
- endpoints de accion: `open` y `close`
- flujo valido: `unassigned -> open -> closed`

## Criterio Para Cambios

Si el cambio toca contrato o comportamiento de negocio:

1. valida rutas, controlador y modelo reales
2. no asumas que el documento de producto ya esta implementado
3. actualiza [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md) en el mismo cambio
4. si hay cambio rompiente, refleja el impacto esperado en frontend

Si el cambio toca seguridad u operacion:

1. actualiza tambien [engineering/HARDENING_PLAN.md](./engineering/HARDENING_PLAN.md)
2. documenta si frontend debe ajustar `Origin`, manejo de `429` o tratamiento de errores `500`

Si el cambio toca esquema:

1. agregar una nueva migracion en `src/models/database/migrations/`
2. no introducir cambios estructurales nuevos en `pnpm start`
3. usar `pnpm run db:migrate` para validar el resultado

## Meta Practica

Tomar el backend actual como base tecnica y seguir cerrando la brecha con el producto objetivo sin documentar como pendiente algo ya implementado, ni como hecho algo que aun no existe.
