# Mapa De Documentacion

Este directorio concentra la documentacion operativa del backend y separa con claridad producto objetivo vs estado real implementado.

## Objetivo

Permitir que frontend, backend y agentes entren por una ruta corta y encuentren rapido:

- que producto se quiere construir
- que contrato HTTP existe hoy
- que brechas siguen abiertas
- que reglas de proceso aplican

## Estructura

```text
docs/
  README.md
  CODEX_CONTEXT.md
  context/
    CONTEXTO_PRODUCTO_CHILLSAGE.md
    ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md
  contracts/
    FRONTEND_API_SERVICES.md
  engineering/
    REVIEW.md
    HARDENING_PLAN.md
  process/
    GIT_RULES.md
```

## Orden De Lectura Recomendado

### Para entender el repo real

1. [CODEX_CONTEXT.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/CODEX_CONTEXT.md)
2. [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
3. [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)

### Para entender el producto objetivo

1. [context/CONTEXTO_PRODUCTO_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
2. [context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)

### Para implementar frontend sobre el backend actual

1. [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
2. [CODEX_CONTEXT.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/CODEX_CONTEXT.md)
3. [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)

## Regla De Oro

- `context/` describe el producto objetivo.
- `contracts/` describe la API real implementada hoy.
- `engineering/` describe riesgos, brechas y endurecimiento pendiente.

Si hay conflicto entre documentos, para desarrollar sobre este repo manda el contrato real en `contracts/`.

## Nota Operativa

El backend ya no ejecuta bootstrap de esquema ni de autenticacion durante `npm run start`.

Para preparar entorno de desarrollo:

- usar `npm run db:ensure-schema` para esquema operativo
- usar `npm run db:bootstrap-auth` para roles y usuarios de prueba
