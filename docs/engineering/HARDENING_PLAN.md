# Plan de Endurecimiento Prioritario

Documento operativo para endurecer el backend antes de exponerlo a clientes externos o llevarlo a produccion.

Fecha de referencia: `2026-03-22`

## Objetivo

Reducir los riesgos mas criticos del proyecto actual sin romper innecesariamente el contrato operativo ya implementado.

## Estado De Ejecucion

Avance actual sobre este plan:

- autenticacion JWT implementada
- autorizacion por rol implementada en rutas
- listas blancas de campos y proteccion de auditoria en recursos criticos
- flujo operativo base implementado en `requests`, `orders` y `schedules`
- reglas de estado y acciones de negocio centralizadas para `requests`, `orders` y `schedules`
- pruebas de integracion de login, autorizacion y modulos operativos implementadas

Pendiente de este plan:

- rotacion de secretos y saneamiento de repositorio
- rate limiting de login
- CORS restringido por entorno
- mayor endurecimiento de errores
- migraciones versionadas
- ampliacion adicional de cobertura fuera del nucleo operativo

## Prioridad 0

### 1. Sacar secretos del repositorio y rotarlos

Problema actual:

- `.env` no debe tratarse como artefacto compartible.
- Si hubo credenciales reales versionadas, deben asumirse comprometidas.

Acciones:

1. Rotar credenciales de base de datos y cualquier secreto expuesto.
2. Mantener `.env` solo local y usar `.env.example` como referencia.
3. Limpiar historial si el repositorio va a circular fuera del equipo actual.
4. Documentar configuracion segura por entorno.

### 2. Endurecer autenticacion

Estado actual:

- resuelto a nivel base con JWT Bearer
- `POST /api/users/login` devuelve `access_token`, `token_type`, `expires_in` y `user`
- todo `/api` salvo login exige autenticacion

Acciones:

1. mantener `JWT_SECRET` y `JWT_EXPIRES_IN` por entorno
2. agregar rate limiting a login
3. evaluar refresh token si el frontend lo necesita

### 3. Endurecer autorizacion

Estado actual:

- resuelto a nivel base por rol y ruta
- hay restricciones operativas adicionales por ownership en `requests` y `orders`

Acciones:

1. mantener actualizada la matriz de acceso por recurso y accion
2. reforzar alcance por cliente en recursos maestros
3. revisar eliminaciones y operaciones administrativas sensibles

### 4. Endurecer validacion de payloads

Estado actual:

- los recursos operativos ya usan listas blancas y validaciones de dominio

Acciones:

1. extender el mismo patron a recursos restantes
2. rechazar campos desconocidos donde aun no se haga
3. validar relaciones y enums de forma consistente
4. consolidar DTOs o helpers de validacion si crece la complejidad

### 5. Endurecer reglas de estado y acciones por endpoint

Estado actual:

- resuelto para `requests`, `orders` y `schedules` con politicas compartidas de dominio
- las transiciones criticas viven en acciones explicitas y no en `PUT`

Acciones:

1. mantener centralizadas las politicas de transicion, permisos y precondiciones
2. impedir cambios de `status` y campos de accion desde `POST` o `PUT` genericos
3. exigir secuencia valida de negocio por endpoint y bloquear repeticiones
4. reutilizar el patron en modulos futuros con estado operativo

## Prioridad 1

### 6. Endurecer manejo de errores

Problema actual:

- aun se filtran mensajes internos en algunos controladores

Acciones:

1. implementar o fortalecer middleware global de errores
2. responder mensajes mas controlados al cliente
3. dejar detalle tecnico en logs
4. unificar criterios para `400`, `401`, `403`, `404`, `409` y `500`

### 7. Restringir CORS

Problema actual:

- la configuracion sigue abierta para desarrollo general

Acciones:

1. definir lista de origins por entorno
2. permitir solo frontends aprobados
3. documentar variables de entorno necesarias

### 8. Mejorar observabilidad

Acciones:

1. agregar logger estructurado
2. incorporar request id por peticion
3. registrar eventos de autenticacion y errores relevantes
4. crear endpoint de health check

## Prioridad 2

### 9. Ampliar pruebas automatizadas

Estado actual:

- existen suites de login, autorizacion y flujos operativos

Acciones:

1. ampliar cobertura a usuarios, clientes y equipos
2. agregar mas escenarios negativos de validacion
3. automatizar ejecucion en CI

### 10. Formalizar gestion del esquema

Problema actual:

- existe bootstrap de esquema operativo, pero no migraciones versionadas

Acciones:

1. adoptar migraciones
2. definir seeders para catalogos base
3. reducir dependencia de cambios automaticos al iniciar

### 11. Agregar paginacion y metadatos

Problema actual:

- los listados siguen usando `findAll()` sin limite

Acciones:

1. agregar `page`, `limit` y `sort`
2. definir maximo de resultados
3. devolver metadata de paginacion

## Orden Recomendado De Ejecucion

1. secretos y rotacion
2. rate limiting y endurecimiento de login
3. reglas de estado y acciones por endpoint
4. manejo de errores
5. CORS
6. migraciones
7. ampliacion de tests
8. observabilidad
9. paginacion

## Criterio Minimo Para Decir "Listo Para Cliente"

Como minimo deberian estar completos:

- secretos fuera del repo
- autenticacion funcional
- autorizacion por rol y alcance suficiente
- validacion de payloads en todos los recursos criticos
- reglas de estado y acciones criticas controladas por endpoint
- errores endurecidos
- CORS restringido
- pruebas basicas de login y de flujos operativos criticos
