# Revision Tecnica

Revision estatica actualizada sobre el estado del proyecto en `2026-03-20`.

## Corregido recientemente

Estos puntos ya no deben tratarse como problemas abiertos:

- El recurso `profiles` ya usa su propio modelo y tabla en [Profile.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Profiles/Profile.model.js).
- `DELETE /api/profiles/:id` ya usa `Profile.findByPk(...)` en [profile.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/profiles/profile.controller.js).
- `DELETE /api/requests/:id` ya usa `Request.findByPk(...)` en [request.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/requests/request.controller.js).
- El login ya no devuelve el hash de `password`; la salida se sanea en [user.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/users/user.controller.js).
- El servidor ahora valida la conexion a la base antes de abrir el puerto HTTP en [index.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/index.js).
- La conexion a MySQL ya acepta `DB_PORT` en [dbconnection.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/database/dbconnection.js).
- `npm start` ya usa `node index.js` y no depende de `nodemon` en [package.json](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/package.json).
- La sincronizacion automatica ya no corre siempre al iniciar; ahora es opt-in con `DB_SYNC=true` en [index.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/index.js).
- El controlador de `requests` ya importa el archivo correcto en [request.controller.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/controllers/requests/request.controller.js).
- Los `update` de `clients`, `equipments`, `orders`, `profiles`, `requests`, `roles` y `schedules` ya responden `200` y devuelven la entidad actualizada desde sus respectivos controladores.
- El modelo de `schedules` ya usa `modelName: "Schedule"` en [Schedule.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Schedules/Schedule.model.js).
- El modelo de `equipments` ya usa el mismo patron de timestamps snake_case que el resto en [Equipment.model.js](/C:/Users/yulia/Documents/projects/chillsage/chillsage-backend/src/models/Equipments/Equipment.model.js).
- Los mensajes de `equipments`, `orders` y `profiles` ya quedaron alineados con el resto de controladores.
- La tabla `orders` y su modelo ya fueron migrados a `user_assigned_id` y `request_id`.
- `bcrypt` fue actualizado a `6.0.0`, eliminando el warning deprecado asociado a `@mapbox/node-pre-gyp` durante el arranque.

## Hallazgos vigentes

No hay hallazgos prioritarios abiertos documentados en esta revision.

## Verificacion realizada

Se pudo verificar en este workspace:

- lectura estatica de rutas, controladores y modelos
- arranque real con `npm start`
- conexion a MySQL
- arranque exitoso del servidor cuando la base esta disponible y el puerto no esta ocupado

No hay pruebas automatizadas en el proyecto para validar CRUD completo.

## Recomendacion

Orden sugerido de correccion:

1. Mantener la documentacion alineada con el esquema real y agregar pruebas automatizadas para evitar regresiones.
