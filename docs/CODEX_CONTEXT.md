# Contexto Para Codex

Documento de entrada rapida para agentes trabajando en este repo.

## Que Es Este Repo

Backend Node.js con `Express` y `Sequelize` para ChillSage.

El codigo actual implementa un backend mixto:

- CRUD administrativo estable para catalogos y maestros
- flujo operativo real para `requests`, `orders` y `schedules`

No existe todavia el dominio completo del producto, pero la operacion principal ya no debe leerse como CRUD generico.

## Fuente De Verdad Por Tema

- producto objetivo: [context/CONTEXTO_PRODUCTO_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
- especificacion funcional: [context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)
- contrato backend/frontend real: [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
- revision de brechas y riesgos: [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)
- reglas de proceso: [process/GIT_RULES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/process/GIT_RULES.md)

## Como Leer El Proyecto

1. Leer este archivo.
2. Leer [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md) para entender la API real.
3. Leer [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md) para entender lo que aun falta.
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
- modelos Sequelize sin capa formal de dominio o servicios
- enriquecimientos manuales para frontend
- tests de integracion HTTP para contrato y permisos

## Arranque Real

`npm run start` hoy hace solo lo necesario para servir la API:

- autentica conexion a MySQL
- inicializa asociaciones Sequelize
- valida configuracion JWT
- levanta Express

No ejecuta bootstrap de esquema, roles ni usuarios de prueba.

Cuando eso se requiere, el repo expone scripts manuales:

- `npm run db:ensure-schema`
- `npm run db:bootstrap-auth`

## Restricciones Reales Del Codigo

- hay autenticacion JWT Bearer
- hay autorizacion por rol en rutas
- no hay refresh token ni sesion server-side
- no hay paginacion
- no hay historial tecnico ni calificaciones como recursos propios
- existe borrado fisico, pero en recursos operativos queda restringido a `admin`

## Estado Operativo Implementado

### Requests

- estados: `pending`, `approved`, `cancelled`
- filtros por `client_id`, `requester_user_id`, `equipment_id`, `status`, `type`, `date_from`, `date_to`
- ownership parcial para `solicitante`
- endpoints de accion: `approve` y `cancel`

### Orders

- estados: `assigned`, `in_progress`, `completed`, `cancelled`
- solo se crea desde `request` aprobada
- filtros por `client_id`, `equipment_id`, `assigned_user_id`, `status`, `type`, `date_from`, `date_to`
- endpoints de accion: `assign`, `start`, `complete`, `cancel`
- tecnico asignado puede iniciar y completar su propia orden

### Schedules

- estados: `unassigned`, `open`, `closed`
- filtros por `client_id`, `status`, `type`, `date_from`, `date_to`
- relacion real `schedule_equipments`
- endpoints de accion: `open` y `close`

## Criterio Para Cambios

Si el cambio toca contrato o comportamiento de negocio:

1. valida rutas, controlador y modelo reales
2. no asumas que el documento de producto ya esta implementado
3. actualiza [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md) en el mismo cambio
4. si hay cambio rompiente, refleja el impacto esperado en frontend

## Meta Practica

Tomar el backend actual como base tecnica y seguir cerrando la brecha con el producto objetivo sin documentar como pendiente algo ya implementado, ni como hecho algo que aun no existe.
