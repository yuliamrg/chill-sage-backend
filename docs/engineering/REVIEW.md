# Revision Tecnica

Revision estatica actualizada sobre el estado documental y funcional del proyecto en `2026-03-28`.

## Resumen Ejecutivo

El backend ya no debe considerarse una base CRUD plana. La brecha principal de dominio se redujo en `requests`, `orders` y `schedules`, que hoy implementan flujo operativo, estados, permisos por rol y validaciones de negocio relevantes.

La brecha que sigue abierta se concentra en:

- historial tecnico
- calificacion del servicio
- paginacion y versionado de esquema
- observabilidad minima
- permisos mas finos fuera del nucleo operativo

## Lo Mejor Resuelto Hoy

- arranque controlado del servidor y validacion de conexion a MySQL
- autenticacion JWT Bearer
- autorizacion por rol en rutas
- listas blancas de campos y proteccion de auditoria
- contrato operativo real para `requests`, `orders` y `schedules`
- filtros por query en modulos operativos
- restricciones de ownership relevantes para `solicitante` y `tecnico`
- pruebas de integracion para login, autorizacion y flujo operativo
- CORS restringido por entorno
- rate limiting en login
- saneamiento base de respuestas `500`

## Estado Del Dominio

### Ya implementado

- `requests` con estados `pending`, `approved`, `cancelled`
- `orders` con estados `assigned`, `in_progress`, `completed`, `cancelled`
- `schedules` con estados `unassigned`, `open`, `closed`
- transiciones de negocio:
  - aprobar y anular solicitud
  - asignar, iniciar, completar y cancelar orden
  - abrir y cerrar cronograma
- validacion de relaciones:
  - solicitud ligada a cliente y equipo coherentes
  - orden creada solo desde solicitud aprobada
  - una orden activa por solicitud
  - cronograma con equipos del mismo cliente

### Aun pendiente

- historial tecnico consolidado por equipo
- calificaciones como modulo y contrato propio
- politicas mas finas de acceso por cliente en recursos maestros
- reemplazar borrado fisico por estrategia mas segura si el dominio lo exige

## Seguridad Y Acceso

Resuelto hoy:

- login publico en `POST /api/users/login`
- autenticacion obligatoria para el resto de `/api`
- `401` y `403` diferenciados
- `DELETE` restringido a `admin` en `requests`, `orders` y `schedules`

Pendiente:

- refresh token
- observabilidad minima
- criterios totalmente uniformes de errores entre todos los controladores

## Operacion Y Calidad

Resuelto hoy:

- suite con `jest` y `supertest`
- cobertura de login y autorizacion
- cobertura de integracion separada por recurso para `requests`, `orders` y `schedules`

Pendiente:

- ampliar cobertura a clientes, equipos y usuarios
- agregar escenarios de regresion sobre errores de validacion y ownership
- pipeline automatizado de CI si se busca mayor confiabilidad

## Recomendacion De Trabajo

Orden sugerido desde el estado actual:

1. implementar `historial tecnico`
2. implementar `calificacion del servicio`
3. formalizar migraciones versionadas
4. agregar observabilidad minima
5. agregar paginacion y metadatos de listado
6. extender cobertura automatizada a modulos no operativos
