# Revision Tecnica

Revision estatica realizada sobre el estado actual del proyecto en `2026-03-20`.

## Hallazgos prioritarios

### 1. El recurso `profiles` esta roto por modelo y por controlador

- En [Profile.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Profiles/Profile.model.js#L5) la clase se llama `Role`.
- En [Profile.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Profiles/Profile.model.js#L45) el `modelName` sigue siendo `Role`.
- En [Profile.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Profiles/Profile.model.js#L46) el `tableName` apunta a `roles`, no a `profiles`.
- En [profile.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/profiles/profile.controller.js#L63) se usa `profile.findByPk(id)` sobre una variable inexistente en vez del modelo `Profile`.

Impacto:

- `DELETE /api/profiles/:id` falla.
- El recurso `profiles` puede leer o escribir sobre la tabla equivocada.

### 2. El recurso `requests` tiene un error de ejecucion en `DELETE`

- En [request.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/requests/request.controller.js#L63) se usa `request.findByPk(id)` sobre una variable inexistente, en lugar del modelo `Request`.

Impacto:

- `DELETE /api/requests/:id` falla en runtime.

### 3. El login devuelve el usuario completo, incluyendo el hash de contrasena

- En [user.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/users/user.controller.js#L23) se retorna `user: user`.

Impacto:

- Se expone el hash de `password` en la respuesta del login.
- Aumenta la superficie de fuga de datos sensibles.

### 4. La inicializacion del servidor acepta trafico antes de confirmar la base de datos

- En [index.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/index.js#L28) el servidor empieza a escuchar primero.
- La sincronizacion con la BD ocurre despues, dentro del callback del `listen`, en [index.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/index.js#L30).

Impacto:

- El proceso puede quedar "arriba" aunque la base falle.
- Los errores de conexion aparecen tarde y el servicio queda en un estado enganoso.

### 5. Hay una inconsistencia entre la documentacion operativa y la conexion real a BD

- [`db.yml`](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/db.yml#L6) publica MySQL en `3307`.
- [dbconnection.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/database/dbconnection.js#L9) solo permite configurar `host`, no `port`.
- [dbconnection.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/database/dbconnection.js#L10) usa dialecto `mysql`.

Impacto:

- El ejemplo de arranque puede no coincidir con la configuracion usada por la app.
- Si MySQL esta en un puerto distinto de `3306`, hoy no hay variable dedicada para configurarlo.

### 6. El script de arranque depende de `nodemon`, pero no esta declarado

- En [package.json](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/package.json#L8) el script `start` usa `nodemon index.js`.
- En [package.json](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/package.json#L13) no existe `nodemon` en dependencias ni en `devDependencies`.

Impacto:

- Un entorno limpio puede fallar al ejecutar `npm start`.

## Hallazgos secundarios

### 7. Hay errores de nomenclatura que degradan claridad y pueden propagar bugs

- En [Order.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Orders/Order.model.js#L14) aparece `user_asigned_id`.
- En [Order.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Orders/Order.model.js#L21) aparece `resquest_id`.
- En [Schedule.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Schedules/Schedule.model.js#L50) el `modelName` es `Scheule`.

Impacto:

- Complica integracion con frontend, SQL manual y mantenimiento.

### 8. La API responde con mensajes y codigos poco consistentes

- Varios controladores reutilizan mensajes como `equipo creado con exito` incluso en recursos no relacionados.
- Algunos `update` responden `201` en vez de `200`.
- En varios `update`, Sequelize devuelve un arreglo con cantidad de filas afectadas, no la entidad actualizada.

Impacto:

- El contrato HTTP es inconsistente.
- El cliente necesita logica extra para interpretar respuestas.

### 9. Hay problemas de codificacion de caracteres en mensajes

- En [user.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/users/user.controller.js#L21), [user.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/users/user.controller.js#L79) y [user.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/users/user.controller.js#L126) aparecen textos con caracteres rotos en respuestas JSON.

Impacto:

- Mala experiencia en respuestas API y senales de manejo inconsistente de encoding en archivos fuente.

## Verificacion realizada

Se pudo verificar por lectura estatica:

- estructura del proyecto
- rutas montadas
- modelos Sequelize
- controladores y contratos basicos

No se pudo validar ejecucion completa porque este workspace no tiene `node_modules` instalados ni una base de datos conectada al proyecto en esta sesion.

## Recomendacion

Orden sugerido de correccion:

1. Reparar `profiles` y `requests` para eliminar fallos de runtime.
2. Dejar de retornar `password` en login y en lecturas de usuario.
3. Corregir arranque y configuracion de base de datos.
4. Normalizar respuestas HTTP y nombres de campos.
5. Agregar pruebas minimas de humo para CRUD y login.
