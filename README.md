# Chillsage Backend

Backend REST construido con `Express` y `Sequelize` para una base operativa inicial de ChillSage.

Este repositorio hoy implementa principalmente CRUD sobre:

- `users`
- `clients`
- `roles`
- `profiles`
- `equipments`
- `requests`
- `orders`
- `schedules`

El proyecto ya sirve como base técnica estable, pero todavia no implementa por completo el comportamiento funcional descrito para ChillSage como plataforma de mantenimiento trazable.

## Estado Real Del Proyecto

Lo que si existe hoy:

- API REST bajo `/api`
- conexion a MySQL con Sequelize
- login por `email` o `username` y `password`
- hash de contraseñas con `bcrypt`
- respuestas JSON consistentes
- manejo centralizado de errores Sequelize
- enriquecimiento de algunas respuestas para frontend

Lo que todavia no existe o esta incompleto:

- autenticacion basada en token o sesion
- middleware de autorizacion por rol
- historial tecnico
- calificacion del servicio
- flujo de negocio completo `solicitud -> orden -> cierre -> historial`
- transiciones de estado controladas por dominio
- paginacion y filtros dedicados por query
- pruebas automatizadas

## Stack

- Node.js
- Express 4
- Sequelize 6
- MySQL
- bcrypt 6

## Estructura De Codigo

```text
index.js
src/
  controllers/
  models/
  routes/
  utils/
docs/
  README.md
  CODEX_CONTEXT.md
  context/
  contracts/
  engineering/
  process/
```

Arquitectura actual:

- `index.js` inicializa Express, CORS, parseo JSON y monta la API en `/api`
- `src/routes/` agrupa rutas por recurso
- `src/controllers/` implementa logica CRUD y algunos enriquecimientos
- `src/models/` define modelos Sequelize
- `src/utils/` centraliza respuestas y manejo de errores

## Documentacion

La documentacion ya no vive suelta en raiz. El punto de entrada es:

- [Mapa de Documentacion](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/README.md)

Si el lector es un agente o alguien que necesita contexto rapido del repo:

- [Contexto Para Codex](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/CODEX_CONTEXT.md)

Orden recomendado de lectura:

1. [docs/CODEX_CONTEXT.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/CODEX_CONTEXT.md)
2. [docs/contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
3. [docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
4. [docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)
5. [docs/engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)

## Requisitos

- Node.js 18+ recomendado
- MySQL disponible
- dependencias instaladas con `npm install`

## Variables De Entorno

El proyecto usa estas variables:

- `PORT`: puerto HTTP del servidor. Opcional. Default `3000`
- `DB_NAME`: nombre de la base de datos
- `DB_USER`: usuario de base de datos
- `DB_PASSWORD`: contrasena de base de datos
- `DB_HOSTNAME`: host de MySQL. Default `127.0.0.1`
- `DB_PORT`: puerto de MySQL. Default `3306`
- `DB_SYNC`: si vale `true`, ejecuta `db.sync({ force: false })` al iniciar

Referencia rapida en [`.env.example`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/.env.example).

## Instalacion

```bash
npm install
npm start
```

Crea `.env` a partir de `.env.example` antes de iniciar.

## Arranque

Comportamiento actual:

- valida conexion con `db.authenticate()` antes de abrir el puerto HTTP
- solo sincroniza modelos si `DB_SYNC=true`
- monta la API bajo `/api`

Uso recomendado:

- en una base existente: iniciar con `DB_SYNC` ausente o en `false`
- en desarrollo controlado: usar `DB_SYNC=true` solo si realmente necesitas sincronizar tablas desde Sequelize

## API

Prefijo base:

```text
/api
```

Recursos disponibles hoy:

- `/users`
- `/clients`
- `/roles`
- `/profiles`
- `/equipments`
- `/requests`
- `/orders`
- `/schedules`

Excepcion adicional:

- `POST /api/users/login`

Todos los recursos anteriores exponen CRUD basico.

## Contrato Con Frontend

El contrato operativo vigente esta documentado en:

- [docs/contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)

Regla de trabajo:

- si cambias campos, llaves, endpoints o payloads del backend, actualiza ese documento en el mismo cambio
- despues refleja el cambio en `../chillsage-frontend`

Archivos frontend a revisar cuando cambia el contrato:

- `src/app/core/models/domain.models.ts`
- `src/app/core/mappers/domain.mappers.ts`
- `src/app/core/services/*.service.ts`
- formularios, listados y detalles del modulo afectado

## Limitaciones Funcionales Actuales

Los documentos de producto describen un objetivo de dominio mas amplio que el codigo actual. Hoy hay desalineaciones importantes:

- `requests` no representa aun la solicitud operativa completa esperada
- `orders` no implementa reglas de negocio de cierre o anulacion
- `schedules` no modela aun cronogramas con cliente, fecha, tipo y equipos asociados
- la API permite borrado fisico de registros en varios recursos
- no hay restriccion de acceso por rol en endpoints

Por eso este backend debe leerse como base CRUD actual, no como implementacion terminada del producto objetivo.

## Otros Documentos

- [Revision tecnica](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)
- [Plan de hardening](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/HARDENING_PLAN.md)
- [Reglas de Git](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/process/GIT_RULES.md)
