# Mapa De Documentacion

Este directorio concentra toda la documentacion operativa del backend.

## Objetivo

Evitar documentos sueltos, referencias ambiguas y lecturas largas sin orden. La idea es que cualquier persona o agente pueda entrar por aqui y encontrar rapido:

- que es vision objetivo del producto
- que esta implementado de verdad hoy
- cual es el contrato backend/frontend
- que deuda tecnica o lineamientos existen

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

### Si quieres entender el repo rapido

1. [CODEX_CONTEXT.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/CODEX_CONTEXT.md)
2. [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
3. [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)

### Si quieres entender el producto objetivo

1. [context/CONTEXTO_PRODUCTO_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
2. [context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)

### Si vas a cambiar backend y frontend

1. [contracts/FRONTEND_API_SERVICES.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/contracts/FRONTEND_API_SERVICES.md)
2. [CODEX_CONTEXT.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/CODEX_CONTEXT.md)
3. [engineering/REVIEW.md](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/docs/engineering/REVIEW.md)

## Regla De Oro

Los documentos bajo `context/` describen el producto objetivo.

Los documentos bajo `contracts/` y `engineering/` describen el estado real del backend actual.

Si hay conflicto entre ambos, para desarrollar sobre el repo actual debes partir del estado real y luego cerrar la brecha hacia el objetivo.
