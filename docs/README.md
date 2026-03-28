# Mapa De Documentación

Este directorio concentra la documentación estable del backend. La idea es simple: menos documentos, mejor conectados y con una sola fuente canónica por tema.

## Cómo Navegar

- si necesitas arrancar o entender el repo: [../README.md](../README.md)
- si trabajas como agente o mantienes el repo: [../AGENTS.md](../AGENTS.md)
- si integras frontend contra el backend actual: [contracts/FRONTEND_API_SERVICES.md](./contracts/FRONTEND_API_SERVICES.md)
- si revisas persistencia: [engineering/CANONICAL_SCHEMA.md](./engineering/CANONICAL_SCHEMA.md)
- si revisas estado actual, brechas o riesgos: [engineering/REVIEW.md](./engineering/REVIEW.md)
- si revisas endurecimiento pendiente: [engineering/HARDENING_PLAN.md](./engineering/HARDENING_PLAN.md)
- si revisas visión objetivo del producto: [context/CONTEXTO_PRODUCTO_CHILLSAGE.md](./context/CONTEXTO_PRODUCTO_CHILLSAGE.md)
- si revisas detalle funcional esperado por módulo: [context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md](./context/ESPECIFICACION_FUNCIONAL_MODULOS_CHILLSAGE.md)

## Estructura

```text
docs/
  README.md
  context/
  contracts/
  engineering/
```

## Regla De Canonicalidad

- `README.md` del repo: entrada rápida y comandos básicos.
- `AGENTS.md`: acuerdos operativos y guía breve para mantenimiento.
- `contracts/`: contrato real del backend implementado hoy.
- `engineering/`: esquema, estado técnico y planes activos.
- `context/`: producto objetivo; no debe asumirse como implementado.

Si hay conflicto entre `context/` y `contracts/`, para construir sobre este backend manda `contracts/`.
