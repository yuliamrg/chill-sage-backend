# Plan De Hardening Activo

Documento operativo minimo para decidir que endurecimiento sigue pendiente de verdad y que ya no merece seguimiento en este repo.

Fecha de referencia: `2026-03-28`

## Objetivo

Mantener solo brechas activas con impacto real en seguridad, operacion o salida a cliente.

Lo ya absorbido por el codigo y la documentacion canonica no debe seguir viviendo aqui como checklist historica.

## Estado Actual

La base de hardening ya esta implementada:

- autenticacion JWT obligatoria en `/api` salvo `POST /users/login` y `GET /api/health`
- autorizacion por rol en rutas y ownership operativo en `requests` y `orders`
- listas blancas de campos y validaciones de dominio en recursos principales
- transiciones de estado por endpoints de accion en `requests`, `orders` y `schedules`
- CORS restringido por `CORS_ORIGINS`
- rate limiting de login
- `X-Request-Id`, logs estructurados y `health check`
- respuestas `500` endurecidas
- migraciones versionadas
- paginacion comun con `page`, `limit`, `sort` y `meta`
- pruebas de integracion del nucleo y recursos maestros

Referencia tecnica y contractual:

- `docs/contracts/FRONTEND_API_SERVICES.md`
- `docs/engineering/REVIEW.md`

## Pendientes Reales

### 1. Secretos y salida del repo

Estado: `pendiente importante`

Mantener como pendiente real solo si el repositorio va a circular fuera del equipo actual o si hubo exposicion previa de credenciales.

Hace falta:

- confirmar rotacion de secretos reales
- decidir si el historial Git debe sanearse antes de compartir o abrir el repo

No hace falta ampliar este punto dentro del repo hasta que exista una accion operativa concreta.

### 2. Rechazo explicito de campos desconocidos

Estado: `recomendado`

Hoy los payloads filtran campos no permitidos en vez de rechazarlos.

Esto si aporta valor real porque:

- vuelve el contrato mas estricto
- evita falsas integraciones donde el frontend cree que un campo se guarda
- reduce ambiguedad al depurar

Prioridad sugerida: media.

### 3. Cobertura negativa y automatizacion minima

Estado: `recomendado`

La suite actual pasa en verde, pero todavia falta cerrar dos huecos utiles:

- mas casos negativos de ownership y validacion fina
- ejecucion automatizada en CI

Esto si aporta porque protege regresiones reales del contrato y evita depender solo de corrida manual local.

Prioridad sugerida: media-alta.

## Proximo Enfoque Recomendado

Si se quiere seguir endureciendo sin meter trabajo de poco retorno, el orden razonable es:

1. confirmar politica de secretos para salida a cliente o distribucion del repo
2. agregar rechazo explicito de campos desconocidos
3. ampliar pruebas negativas clave
4. montar CI basica con `pnpm test`

## Regla De Mantenimiento

Este archivo debe listar solo decisiones abiertas y brechas activas.

Cuando un punto quede absorbido por el codigo o se descarte explicitamente por no aportar, debe resumirse o salir del documento.
