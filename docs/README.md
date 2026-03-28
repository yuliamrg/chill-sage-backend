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
    CANONICAL_SCHEMA.md
    REVIEW.md
    HARDENING_PLAN.md
  process/
    GIT_RULES.md
```

## Orden De Lectura Recomendado

### Para entender el repo real

1. [CODEX_CONTEXT.md](./CODEX_CONTEXT.md)
2. [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md)
3. [engineering/CANONICAL_SCHEMA.md](./engineering/CANONICAL_SCHEMA.md)
4. [engineering/REVIEW.md](./engineering/REVIEW.md)

### Para entender el producto objetivo

1. [context/CONTEXTO_PRODUCTO_CHILLSAGE.md](./context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
2. [context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](./context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)

### Para implementar frontend sobre el backend actual

1. [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md)
2. [CODEX_CONTEXT.md](./CODEX_CONTEXT.md)
3. [engineering/REVIEW.md](./engineering/REVIEW.md)

## Regla De Oro

- `context/` describe el producto objetivo.
- `contracts/` describe la API real implementada hoy.
- `engineering/CANONICAL_SCHEMA.md` define el esquema oficial persistente del backend.
- `engineering/` describe riesgos, brechas y endurecimiento pendiente.

Si hay conflicto entre documentos, para desarrollar sobre este repo manda el contrato real en `contracts/`.

## Nota Operativa

El backend ya no ejecuta bootstrap de esquema ni de autenticacion durante `pnpm start`.

Para preparar entorno de desarrollo:

- usar `pnpm run db:migrate` para aplicar esquema versionado
- `pnpm run db:ensure-schema` queda como alias de compatibilidad
- usar `pnpm run db:bootstrap-auth` para roles y usuarios de prueba

## Compatibilidad De Frontend

Si el frontend consume este backend desde navegador, debe revisar siempre:

1. [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md)
2. [engineering/HARDENING_PLAN.md](./engineering/HARDENING_PLAN.md)

Cambios de compatibilidad vigentes hoy:

- el origin del frontend debe estar incluido en `CORS_ORIGINS`
- para desarrollo con Angular CLI, incluir `http://localhost:4200` y `http://127.0.0.1:4200`
- login puede responder `429` por rate limiting
- los errores `500` ya no exponen detalle interno; frontend debe tratar `msg` como texto final para usuario o fallback tecnico generico
- todas las respuestas incluyen `X-Request-Id` para soporte y correlacion
- existe `GET /api/health` sin autenticacion para chequeo operativo basico
- la autenticacion sigue siendo solo `Bearer token`
- `equipments` ya no debe integrarse como CRUD libre para `planeador`; revisar matriz de permisos y restricciones de campos en [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md)
