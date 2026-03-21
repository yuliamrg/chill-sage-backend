# Plan de Endurecimiento Prioritario

Documento operativo para endurecer el backend antes de exponerlo a clientes externos o llevarlo a produccion.

Fecha de referencia: 2026-03-20

## Objetivo

Reducir los riesgos mas criticos del proyecto actual sin perder compatibilidad funcional innecesaria.

## Prioridad 0

Estos puntos deben resolverse antes de cualquier despliegue serio.

### 1. Sacar secretos del repositorio y rotarlos

Problema actual:

- `.env` esta versionado en git.
- Si hubo credenciales reales en ese archivo, deben tratarse como comprometidas.

Acciones:

1. Rotar usuario, password y cualquier credencial usada por la base de datos actual.
2. Confirmar que `.env` quede solo local y que el archivo de referencia sea `.env.example`.
3. Limpiar historial de git si el repositorio va a seguir siendo compartido o publico.
4. Documentar el procedimiento seguro de configuracion local.

Resultado esperado:

- Ninguna credencial real presente en el repo.
- Equipo trabajando con variables locales o secret manager.

### 2. Agregar autenticacion real

Problema actual:

- Existe login, pero no genera token ni sesion.
- Ninguna ruta CRUD exige autenticacion.

Acciones:

1. Definir el mecanismo: JWT firmado o sesion server-side.
2. Hacer que `POST /api/users/login` devuelva un artefacto de autenticacion utilizable.
3. Crear middleware de autenticacion para proteger `/api/*`.
4. Permitir excepciones controladas solo para login y, si aplica, bootstrap inicial.

Resultado esperado:

- El frontend no podra leer o modificar datos sin autenticarse.

### 3. Agregar autorizacion por rol o permisos

Problema actual:

- Cualquier consumidor puede crear, editar o borrar cualquier recurso.
- El modelo ya tiene `role`, pero el backend no lo usa para controlar acceso.

Acciones:

1. Definir permisos por recurso y accion.
2. Implementar middleware como `requireRole(...)` o `requirePermission(...)`.
3. Restringir especialmente:
   - gestion de usuarios
   - eliminaciones
   - catalogos maestros como roles y perfiles
4. Evitar que un usuario comun cambie su propio `role`, `status` o campos de auditoria.

Resultado esperado:

- Cada tipo de usuario solo puede operar sobre lo que le corresponde.

### 4. Eliminar mass assignment y validar payloads

Problema actual:

- Los controladores pasan `req.body` directo a Sequelize.
- El cliente puede inyectar campos sensibles.

Acciones:

1. Definir DTOs o listas blancas por endpoint.
2. Aceptar solo los campos esperados en `create` y `update`.
3. Rechazar campos desconocidos.
4. Agregar validacion de formatos, requeridos, enums y relaciones.
5. Validar ids antes de consultar o actualizar.

Resultado esperado:

- El backend solo persiste datos permitidos y con formato consistente.

## Prioridad 1

Estas tareas deben ejecutarse inmediatamente despues de cerrar la Prioridad 0.

### 5. Endurecer manejo de errores

Problema actual:

- Se devuelve `error.message` al cliente.

Acciones:

1. Implementar middleware global de errores.
2. Responder mensajes genericos al cliente.
3. Registrar detalle tecnico solo en logs del servidor.
4. Diferenciar errores esperados: validacion, autenticacion, autorizacion, conflicto y fallo interno.

Resultado esperado:

- Menor filtracion de detalles internos y respuestas consistentes.

### 6. Restringir CORS

Problema actual:

- `cors()` esta abierto a cualquier origen.

Acciones:

1. Definir lista de origins por entorno.
2. Permitir solo frontend local de desarrollo y dominios aprobados.
3. Documentar variables de entorno para CORS.

Resultado esperado:

- El backend solo aceptara navegadores desde origenes autorizados.

### 7. Agregar rate limiting y proteccion de login

Problema actual:

- Login sin throttling ni bloqueo progresivo.

Acciones:

1. Aplicar rate limiting a `/api/users/login`.
2. Considerar limite global por IP para endpoints sensibles.
3. Evaluar lock temporal por usuario o IP ante intentos repetidos.

Resultado esperado:

- Menor riesgo de fuerza bruta y abuso.

### 8. Mejorar observabilidad

Acciones:

1. Agregar logger estructurado.
2. Incorporar request id por peticion.
3. Registrar errores, tiempo de respuesta y eventos de autenticacion.
4. Crear endpoint de health check.

Resultado esperado:

- Diagnostico mas rapido en desarrollo y despliegue.

## Prioridad 2

Mejoras de confiabilidad y mantenimiento.

### 9. Agregar pruebas automatizadas

Problema actual:

- No existen tests.

Acciones:

1. Crear pruebas de smoke para arranque.
2. Cubrir login, usuarios, clientes, equipos y ordenes.
3. Probar errores de validacion, 404, 401 y 403.
4. Agregar pipeline de ejecucion automatica.

Resultado esperado:

- Menor riesgo de regresiones en cambios futuros.

### 10. Formalizar gestion del esquema

Problema actual:

- El proyecto depende del esquema existente y de `DB_SYNC` solo para sincronizacion basica.

Acciones:

1. Adoptar migraciones versionadas.
2. Definir seeders para catalogos basicos.
3. Eliminar dependencia operativa de cambios manuales de esquema.

Resultado esperado:

- Esquema reproducible entre desarrollo, QA y produccion.

### 11. Estandarizar contratos de respuesta

Problema actual:

- Hay respuestas con `message`, otras con `msg`, otras con llaves distintas.

Acciones:

1. Definir formato uniforme para exito y error.
2. Estandarizar nombres de propiedades.
3. Versionar el contrato si se introduce un cambio rompiente.

Resultado esperado:

- Integracion frontend mas simple y menos codigo defensivo.

### 12. Agregar paginacion y filtros

Problema actual:

- Todos los listados usan `findAll()` sin limite.

Acciones:

1. Agregar `page`, `limit`, `sort` y filtros basicos.
2. Definir maximo de resultados por consulta.
3. Devolver metadata de paginacion.

Resultado esperado:

- Mejor rendimiento y mejor experiencia para el frontend.

## Orden recomendado de ejecucion

1. Secretos y rotacion
2. Autenticacion
3. Autorizacion
4. Validacion y listas blancas
5. Manejo de errores
6. CORS
7. Rate limiting
8. Tests
9. Logs y health check
10. Migraciones
11. Contratos uniformes
12. Paginacion

## Criterio minimo para decir "listo para cliente"

Como minimo deberian estar completos:

- secretos fuera del repo
- autenticacion funcional
- autorizacion por rol o permiso
- validacion de payloads
- errores endurecidos
- CORS restringido
- pruebas basicas de login y CRUD critico
