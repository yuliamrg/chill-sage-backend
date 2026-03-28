# Plan de Endurecimiento Prioritario

Documento operativo para endurecer el backend antes de exponerlo a clientes externos o llevarlo a produccion.

Fecha de referencia inicial: `2026-03-22`
Ultima actualizacion: `2026-03-28`

## Como Usar Este Documento

Este plan ahora se mantiene como checklist viva.

Reglas de uso:

- `[x]` completado y verificado en codigo o configuracion
- `[-]` avance parcial, implementado solo en parte o con brechas abiertas
- `[ ]` pendiente

En cada avance se debe actualizar:

1. el estado del item
2. la evidencia concreta
3. la brecha restante si aplica
4. la fecha de ultima actualizacion

## Resumen Ejecutivo

Estado general estimado del plan: `parcial`, con avance aproximado de `60-70%`.

Lo ya resuelto en el backend actual:

- [x] autenticacion JWT implementada
- [x] autorizacion por rol implementada en rutas
- [x] listas blancas de campos y proteccion de auditoria en recursos criticos
- [x] flujo operativo base implementado en `requests`, `orders` y `schedules`
- [x] reglas de estado y acciones de negocio centralizadas para `requests`, `orders` y `schedules`
- [x] pruebas de integracion de login, autorizacion y modulos operativos implementadas

Lo aun pendiente o parcial:

- [-] secretos fuera del repo y rotacion confirmada
- [x] rate limiting de login
- [x] CORS restringido por entorno
- [x] endurecimiento de errores
- [x] observabilidad minima
- [x] migraciones versionadas
- [x] paginacion y metadatos
- [-] ampliacion adicional de cobertura fuera del nucleo operativo

## Checklist Operativa

### Prioridad 0

#### 1. Sacar secretos del repositorio y rotarlos

Estado: `[-] parcial`

Checklist:

- [-] `.env` mantenido solo local
- [x] `.env.example` disponible como referencia
- [ ] credenciales rotadas si hubo exposicion previa
- [ ] historial saneado si el repositorio va a circular fuera del equipo actual
- [x] configuracion segura por entorno documentada

Evidencia actual:

- `.env` existe localmente y no esta versionado
- `.env.example` esta versionado
- `.gitignore` incluye `.env`
- `README.md`, `docs/README.md` y `docs/contracts/FRONTEND_API_SERVICES.md` documentan `CORS_ORIGINS`, rate limit de login y expectativas de integracion de frontend

Brecha actual:

- No hay evidencia en el repo de rotacion real de secretos ni de saneamiento de historial

#### 2. Endurecer autenticacion

Estado: `[-] parcial`

Checklist:

- [x] login con JWT Bearer implementado
- [x] todo `/api` salvo login exige autenticacion
- [x] `JWT_SECRET` es obligatorio al iniciar
- [x] `JWT_EXPIRES_IN` configurable por entorno
- [x] rate limiting de login
- [ ] refresh token si frontend lo necesita

Evidencia actual:

- `POST /api/users/login` devuelve `access_token`, `token_type`, `expires_in` y `user`
- `requireAuth` protege el resto de `/api`
- la configuracion JWT falla si no existe `JWT_SECRET`

Brecha actual:

- Sigue siendo un limiter en memoria local. Si se despliega en multiples instancias o detras de proxy complejo, conviene moverlo a un store compartido

#### 3. Endurecer autorizacion

Estado: `[-] parcial`

Checklist:

- [x] autorizacion base por rol y ruta
- [x] restricciones operativas adicionales por ownership en `requests` y `orders`
- [x] `DELETE` restringido a `admin` en modulos operativos
- [ ] matriz de acceso por recurso y accion documentada y mantenida
- [ ] alcance por cliente reforzado en recursos maestros
- [ ] revision adicional de operaciones administrativas sensibles

Evidencia actual:

- el middleware de autenticacion y roles esta operativo
- el nucleo operativo aplica restricciones de ownership

Brecha actual:

- `users`, `clients`, `equipments` y otros recursos maestros aun requieren permisos mas finos y mayor aislamiento por cliente

#### 4. Endurecer validacion de payloads

Estado: `[-] parcial`

Checklist:

- [x] `requests`, `orders` y `schedules` usan listas blancas y validaciones de dominio
- [-] `users`, `clients` y `equipments` usan listas blancas basicas
- [ ] rechazar explicitamente campos desconocidos donde hoy se silencian
- [ ] validar relaciones y enums de forma consistente en recursos no operativos
- [ ] consolidar DTOs o helpers si la complejidad crece

Evidencia actual:

- el patron de `pickAllowedFields` ya esta extendido a varios controladores
- el mayor endurecimiento de negocio vive en el nucleo operativo

Brecha actual:

- en recursos maestros aun predomina whitelisting basico sin validaciones mas ricas ni rechazo explicito de campos sobrantes

#### 5. Endurecer reglas de estado y acciones por endpoint

Estado: `[x] completado`

Checklist:

- [x] politicas de transicion, permisos y precondiciones centralizadas
- [x] cambios criticos de estado viven en endpoints de accion y no en `PUT`
- [x] secuencia de negocio valida exigida en `requests`, `orders` y `schedules`
- [x] bloqueo de repeticiones y transiciones invalidas en flujo operativo

Evidencia actual:

- el dominio operativo ya no depende de CRUD plano para transiciones criticas

Brecha actual:

- reutilizar el patron en modulos futuros con estado operativo

### Prioridad 1

#### 6. Endurecer manejo de errores

Estado: `[x] completado`

Checklist:

- [x] existe middleware global para JSON invalido y errores no manejados
- [x] existe normalizacion parcial de errores Sequelize
- [x] respuestas cliente sin filtrar `error.message` interno
- [-] criterios totalmente unificados para `400`, `401`, `403`, `404`, `409` y `500`
- [x] logging tecnico desacoplado de la respuesta al cliente

Evidencia actual:

- hay middleware global de errores
- existe `handleRequestError` para varios controladores

Brecha actual:

- ya no se exponen mensajes internos de excepcion en respuestas `500`, pero aun queda margen para consolidar completamente todos los criterios de error HTTP

#### 7. Restringir CORS

Estado: `[x] completado`

Checklist:

- [x] lista de origins definida por entorno
- [x] permitir solo frontends aprobados
- [x] variables de entorno documentadas

Evidencia actual:

- CORS ahora depende de `CORS_ORIGINS`
- requests con `Origin` no permitido son rechazadas
- `.env.example` ya incluye origins locales tipicos para Angular CLI y Vite

Brecha actual:

- mantener alineada la lista de origins con los frontends reales por entorno

#### 8. Mejorar observabilidad

Estado: `[x] completado`

Checklist:

- [x] logger estructurado
- [x] request id por peticion
- [x] eventos relevantes de autenticacion y error registrados de forma consistente
- [x] endpoint de health check

Evidencia actual:

- existe logging estructurado JSON en `src/observability/logger.js`
- cada request recibe `X-Request-Id` via `src/observability/requestContext.js`
- `GET /api/health` responde sin autenticacion
- login, fallos de auth y errores no manejados quedan registrados con contexto y `requestId`
- pruebas de integracion cubren `health check` y propagacion de `X-Request-Id`

Brecha actual:

- la observabilidad sigue siendo minima: aun no hay agregacion externa, metricas, ni trazas distribuidas

### Prioridad 2

#### 9. Ampliar pruebas automatizadas

Estado: `[-] parcial`

Checklist:

- [x] suites de login, autorizacion y flujos operativos existentes
- [ ] cobertura adicional para `users`
- [ ] cobertura adicional para `clients`
- [ ] cobertura adicional para `equipments`
- [ ] mas escenarios negativos de validacion y ownership
- [ ] ejecucion automatizada en CI

Evidencia actual:

- existen pruebas de integracion para login, autorizacion y flujo operativo
- existen pruebas adicionales para observabilidad, migraciones, hardening y paginacion
- `pnpm test` ejecutado con exito el `2026-03-28`: `9` suites y `29` tests en verde

Brecha actual:

- la cobertura sigue concentrada en el nucleo operativo

#### 10. Formalizar gestion del esquema

Estado: `[x] completado`

Checklist:

- [x] adoptar migraciones versionadas
- [ ] definir seeders para catalogos base
- [x] reducir dependencia de cambios automaticos al iniciar

Evidencia actual:

- existe runner de migraciones versionadas en `src/models/database/migrations/`
- `pnpm run db:migrate` crea y usa la tabla `schema_migrations`
- el esquema canonico base y las extensiones operativas evidenciadas quedaron migradas a archivos versionados
- `pnpm run db:migrate` fue validado con exito el `2026-03-28`, incluyendo segunda corrida idempotente con `0` migraciones aplicadas

Brecha actual:

- aun falta formalizar seeders versionados para catalogos base y datos iniciales no operativos

#### 11. Agregar paginacion y metadatos

Estado: `[x] completo`

Checklist:

- [x] agregar `page`, `limit` y `sort`
- [x] definir maximo de resultados
- [x] devolver metadata de paginacion

Evidencia actual:

- los listados de `clients`, `equipments`, `users`, `requests`, `orders`, `schedules`, `roles` y `profiles` aceptan `page`, `limit` y `sort`
- existe utilidad comun en `src/utils/pagination.js` con default `25` y maximo `100`
- las respuestas de coleccion devuelven `meta.pagination` y `meta.sort`
- existen pruebas de integracion del contrato de paginacion en `tests/integration/pagination.integration.test.js`

Brecha actual:

- sigue faltando decidir si algunos catalogos pequenos deben exponerse completos en endpoints separados tipo `select-options`

## Orden Recomendado De Ejecucion

1. secretos y rotacion
2. rate limiting y endurecimiento de login
3. manejo de errores
4. CORS
5. observabilidad
6. migraciones
7. ampliacion de tests
8. paginacion

## Criterio Minimo Para Decir "Listo Para Cliente"

Como minimo deberian estar completos:

- [ ] secretos fuera del repo con rotacion confirmada
- [x] autenticacion funcional
- [-] autorizacion por rol y alcance suficiente
- [-] validacion de payloads en todos los recursos criticos
- [x] reglas de estado y acciones criticas controladas por endpoint
- [x] errores endurecidos
- [x] CORS restringido
- [x] observabilidad minima
- [x] migraciones versionadas
- [x] pruebas basicas de login y de flujos operativos criticos

## Regla De Mantenimiento

Cada vez que avancemos en un item de este plan, este archivo debe actualizarse en el mismo cambio o inmediatamente despues.
