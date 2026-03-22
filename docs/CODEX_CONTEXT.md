# Contexto Para Codex

Documento de entrada rapida para agentes trabajando en este repo.

## Que Es Este Repo

Backend Node.js con `Express` y `Sequelize` para ChillSage.

El codigo actual no implementa todavia todo el dominio objetivo de mantenimiento. Lo que existe hoy es una base CRUD estable sobre usuarios, clientes, equipos, solicitudes simples, ordenes simples, horarios, roles y perfiles.

## Fuente De Verdad Por Tema

- producto objetivo: [context/CONTEXTO_PRODUCTO_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
- especificacion funcional por modulos: [context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)
- contrato backend/frontend real: [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
- deuda tecnica y brecha actual: [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)
- reglas de proceso: [process/GIT_RULES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/process/GIT_RULES.md)

## Como Leer El Proyecto

1. Leer este archivo.
2. Leer [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md) para entender la API real.
3. Leer [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md) para entender la brecha funcional.
4. Solo despues usar los documentos de `context/` para orientar nuevos cambios de producto.

## Arquitectura Real

```text
index.js
src/
  controllers/
  models/
  routes/
  utils/
```

Patron dominante actual:

- rutas por recurso
- controladores CRUD
- modelos Sequelize sin capa de servicios de dominio
- algunas respuestas enriquecidas manualmente

## Restricciones Reales Del Codigo

- no hay JWT ni sesiones
- no hay middleware de autenticacion o autorizacion
- no hay historial tecnico
- no hay calificaciones
- no hay paginacion ni filtros por query
- hay borrado fisico en varios recursos
- las reglas de estado del producto casi no estan implementadas

## Criterio Para Cambios

Si el cambio pide alineacion con producto, no asumas que el backend ya cumple la especificacion.

Primero valida:

- que modulo existe realmente
- que campos existen en el modelo Sequelize
- que endpoints existen de verdad
- que reglas de negocio estan implementadas y cuales no

## Regla De Sincronizacion

Si cambias el contrato HTTP del backend, debes actualizar:

1. [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
2. el frontend consumidor en `../chillsage-frontend`

## Meta Practica

Tomar el backend actual como base tecnica y cerrarle la brecha con el producto objetivo sin documentar como hecho lo que todavia no existe.
