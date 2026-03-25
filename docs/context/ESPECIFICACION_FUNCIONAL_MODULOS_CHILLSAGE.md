# Especificacion Funcional por Modulos: ChillSage

## 1. Proposito

Este documento traduce el contexto general del producto a una especificacion funcional organizada por modulos. Su funcion es servir como contrato funcional para desarrollo, diseno, pruebas y ajustes de una base existente.

Debe leerse junto con [CONTEXTO_PRODUCTO_CHILLSAGE.md](./CONTEXTO_PRODUCTO_CHILLSAGE.md), pero este archivo ya esta escrito en formato operativo para construir el sistema.

## 2. Alcance de esta especificacion

La especificacion cubre:

- autenticacion y control de acceso
- usuarios y roles
- clientes
- equipos
- solicitudes
- ordenes de trabajo
- cronogramas
- historial tecnico
- calificacion del servicio
- dashboard y reportes en fase posterior

## 3. Convenciones funcionales transversales

Estas reglas aplican a todos los modulos:

- todo listado debe permitir busqueda, filtros y orden basico
- todo registro debe tener vista de detalle cuando su complejidad lo amerite
- el frontend puede guiar y validar, pero el backend es la fuente final de verdad
- los cambios criticos deben pedir confirmacion
- no se deben permitir acciones incompatibles con el estado del registro
- en modulos operativos los cambios de estado deben salir de endpoints de accion y no de `PUT`
- los roles deben restringir navegacion, botones y endpoints
- no se deben eliminar fisicamente registros operativos criticos en la operacion normal
- los mensajes de error y exito deben ser claros y accionables
- fechas, estados y responsables deben estar visibles en los modulos operativos

## 4. Mapa de modulos

- `M01` Autenticacion y control de acceso
- `M02` Usuarios y roles
- `M03` Clientes
- `M04` Equipos
- `M05` Solicitudes
- `M06` Ordenes de trabajo
- `M07` Cronogramas
- `M08` Historial tecnico
- `M09` Calificacion del servicio
- `M10` Dashboard y reportes

## 5. M01 - Autenticacion y control de acceso

### Objetivo

Permitir que solo usuarios autorizados ingresen al sistema y accedan unicamente a las funciones permitidas por su rol.

### Actores

- administrador
- planeador
- tecnico
- solicitante

### Datos involucrados

- `usuarios`
- credenciales
- rol
- estado de usuario

### Requerimientos funcionales

- `AUT-01` El sistema debe permitir inicio de sesion con `email` y `password`.
- `AUT-02` El sistema debe validar que el usuario exista, este activo y tenga credenciales correctas.
- `AUT-03` El sistema debe negar acceso cuando el usuario este inactivo o las credenciales sean invalidas.
- `AUT-04` El sistema debe permitir cierre de sesion.
- `AUT-05` El sistema debe proteger rutas y endpoints segun autenticacion.
- `AUT-06` El sistema debe aplicar autorizacion segun rol.
- `AUT-07` El usuario autenticado debe poder consultar su perfil basico.
- `AUT-08` El usuario autenticado debe poder cambiar su propia contrasena.

### Reglas funcionales

- solo usuarios con `estado = activo` pueden ingresar
- el rol debe cargarse en sesion para controlar permisos
- el backend nunca debe devolver `password_hash`
- el cambio de contrasena debe requerir validacion de identidad o contrasena actual

### Comportamiento esperado en frontend

- mostrar formulario de acceso simple y claro
- mostrar error generico si las credenciales fallan
- redirigir al modulo inicial segun rol
- ocultar menus y acciones no permitidas
- proteger rutas privadas

### Comportamiento esperado en backend

- validar credenciales
- generar sesion o token de acceso
- exponer informacion basica del usuario autenticado
- validar permisos en cada endpoint protegido

### Criterios minimos de aceptacion

- un usuario activo puede entrar y salir del sistema
- un usuario inactivo no puede ingresar
- un tecnico no ve modulos administrativos si no tiene permiso

## 6. M02 - Usuarios y roles

### Objetivo

Administrar las personas que usan el sistema y su nivel de acceso.

### Actores

- administrador

### Datos involucrados

- `usuarios`
- `usuarios_clientes`
- roles del sistema

### Requerimientos funcionales

- `USR-01` El sistema debe listar usuarios con filtros por nombre, email, rol y estado.
- `USR-02` El sistema debe permitir crear usuarios.
- `USR-03` El sistema debe permitir editar datos de usuarios.
- `USR-04` El sistema debe permitir activar o inactivar usuarios.
- `USR-05` El sistema debe permitir asignar el rol del usuario.
- `USR-06` El sistema debe permitir asociar usuarios a clientes cuando aplique.
- `USR-07` El sistema debe permitir consultar el detalle de un usuario.

### Reglas funcionales

- el email debe ser unico
- el rol debe pertenecer al catalogo definido
- un usuario inactivado no pierde su historial
- un solicitante asociado a un cliente solo debe operar dentro del alcance de ese cliente

### Comportamiento esperado en frontend

- formulario con validaciones de nombre, email, rol y estado
- selector de clientes para usuarios asociados a clientes
- chips visuales para rol y estado
- acciones de editar e inactivar claramente diferenciadas

### Comportamiento esperado en backend

- validar unicidad de email
- cifrar contrasena al crear o cambiar
- persistir asociaciones usuario-cliente
- aplicar restricciones segun rol del usuario autenticado

### Criterios minimos de aceptacion

- el administrador puede crear y editar usuarios
- no se puede crear dos usuarios con el mismo email
- un usuario inactivo deja de poder acceder al sistema

## 7. M03 - Clientes

### Objetivo

Administrar las empresas o entidades atendidas y servir como punto de agrupacion para equipos, solicitudes y cronogramas.

### Actores

- administrador
- planeador

### Datos involucrados

- `clientes`
- `usuarios_clientes`
- referencias desde equipos y cronogramas

### Requerimientos funcionales

- `CLI-01` El sistema debe listar clientes con filtros por nombre y datos de contacto.
- `CLI-02` El sistema debe permitir crear clientes.
- `CLI-03` El sistema debe permitir editar clientes.
- `CLI-04` El sistema debe permitir consultar el detalle del cliente.
- `CLI-05` El detalle del cliente debe mostrar sus usuarios asociados.
- `CLI-06` El detalle del cliente debe mostrar sus equipos.
- `CLI-07` El detalle del cliente debe mostrar solicitudes, ordenes y cronogramas relacionados cuando existan.

### Reglas funcionales

- el nombre del cliente es obligatorio
- el cliente es la unidad de agrupacion principal para la operacion
- un cliente puede tener varios equipos y varios usuarios asociados

### Comportamiento esperado en frontend

- listado con acceso a detalle
- detalle en formato de ficha operativa
- secciones o pestañas para usuarios, equipos e historial relacionado

### Comportamiento esperado en backend

- exponer consultas por cliente con relaciones necesarias
- permitir asociar y consultar usuarios relacionados
- restringir vistas cuando el actor no tenga alcance global

### Criterios minimos de aceptacion

- se puede crear y editar un cliente
- desde el detalle del cliente se pueden consultar sus equipos
- el sistema puede limitar el acceso de solicitantes a solo su cliente

## 8. M04 - Equipos

### Objetivo

Administrar los activos sobre los que se prestan servicios de mantenimiento.

### Actores

- administrador
- planeador
- tecnico
- solicitante con permisos de consulta limitados

### Datos involucrados

- `equipos`
- `clientes`
- referencias desde solicitudes y cronogramas

### Requerimientos funcionales

- `EQU-01` El sistema debe listar equipos con filtros por cliente, tipo, marca, estado y numero de serie.
- `EQU-02` El sistema debe permitir crear equipos.
- `EQU-03` El sistema debe permitir editar equipos.
- `EQU-04` El sistema debe permitir consultar el detalle del equipo.
- `EQU-05` El detalle del equipo debe mostrar informacion tecnica y ubicacion.
- `EQU-06` El detalle del equipo debe servir de punto de acceso al historial tecnico.
- `EQU-07` El sistema debe permitir cambiar el estado del equipo.

### Reglas funcionales

- el numero de serie debe ser unico
- el equipo debe estar asociado a un cliente en la operacion normal
- equipos `de_baja` o `retirados` conservan historial pero no deben usarse en nuevas programaciones preventivas
- el estado del equipo debe afectar las acciones disponibles

### Comportamiento esperado en frontend

- filtros visibles por cliente y estado
- ficha tecnica en el detalle
- indicadores de estado del equipo
- acceso rapido a solicitudes, ordenes y cronogramas relacionados

### Comportamiento esperado en backend

- validar unicidad de numero de serie
- validar existencia del cliente asociado
- devolver informacion agregada para el detalle e historial del equipo

### Criterios minimos de aceptacion

- se puede crear equipo con datos tecnicos validos
- no se permite duplicar el numero de serie
- el detalle del equipo muestra la base del historial operativo

## 9. M05 - Solicitudes

### Objetivo

Registrar necesidades de servicio y convertirlas en el punto de partida del flujo operativo.

### Actores

- solicitante
- administrador
- planeador

### Datos involucrados

- `solicitudes`
- `usuarios`
- `equipos`

### Requerimientos funcionales

- `SOL-01` El sistema debe permitir crear solicitudes.
- `SOL-02` El sistema debe listar solicitudes con filtros por cliente, solicitante, tipo, estado y fecha.
- `SOL-03` El sistema debe permitir consultar el detalle de una solicitud.
- `SOL-04` El sistema debe permitir aprobar una solicitud.
- `SOL-05` El sistema debe permitir anular una solicitud.
- `SOL-06` El sistema debe registrar observaciones de revision cuando aplique.
- `SOL-07` El sistema debe permitir relacionar la solicitud con un equipo.
- `SOL-08` El sistema debe mostrar si la solicitud ya genero una orden de trabajo.

### Reglas funcionales

- la solicitud nace en estado `pendiente`
- una solicitud anulada no puede generar orden
- una solicitud aprobada queda habilitada para crear orden
- una solicitud `approved` o `cancelled` no debe editarse por `PUT`
- el solicitante solo debe ver sus solicitudes o las de su cliente
- el equipo asociado debe pertenecer al alcance del cliente del solicitante si esa restriccion existe en la operacion

### Comportamiento esperado en frontend

- formulario orientado a registro rapido
- filtros por estado y tipo visibles en el listado
- etiquetas de estado claras
- accion de aprobar o anular restringida a roles operativos
- no mostrar selector libre de estado en formularios de solicitud
- cuando el estado sea distinto de `pending`, mostrar el registro como solo lectura
- detalle con trazabilidad de quien creo y quien reviso

### Comportamiento esperado en backend

- validar datos obligatorios
- persistir fecha de creacion
- controlar transiciones de estado
- bloquear conversion a orden cuando la solicitud este anulada

### Criterios minimos de aceptacion

- un solicitante puede registrar una solicitud
- un planeador puede aprobar o anular
- la solicitud aprobada queda disponible para pasar a orden

## 10. M06 - Ordenes de trabajo

### Objetivo

Gestionar la ejecucion concreta del trabajo tecnico derivado de una solicitud aprobada.

### Actores

- administrador
- planeador
- tecnico

### Datos involucrados

- `ordenes_trabajo`
- `solicitudes`
- `usuarios` tecnicos
- `equipos`

### Requerimientos funcionales

- `ORD-01` El sistema debe permitir crear una orden desde una solicitud aprobada.
- `ORD-02` El sistema debe listar ordenes con filtros por tecnico, estado, cliente, equipo y fechas.
- `ORD-03` El sistema debe permitir consultar el detalle de una orden.
- `ORD-04` El sistema debe permitir asignar tecnico responsable.
- `ORD-05` El tecnico asignado debe poder registrar `fecha_inicio`.
- `ORD-06` El tecnico asignado debe poder registrar `fecha_fin`.
- `ORD-07` El tecnico asignado debe poder registrar `horas_trabajadas`.
- `ORD-08` El tecnico asignado debe poder registrar `descripcion_trabajo`.
- `ORD-09` El sistema debe permitir marcar la orden como `completed`.
- `ORD-10` El sistema debe permitir anular una orden.
- `ORD-11` El sistema debe indicar si la orden fue recibida a satisfaccion.

### Reglas funcionales

- la orden solo puede nacer desde una solicitud aprobada
- solo se permite una orden activa por solicitud
- una orden `cancelled` no puede cerrarse ni calificarse
- una orden `completed` debe tener tecnico, fecha_inicio, fecha_fin y descripcion_trabajo
- una orden `completed` o `cancelled` no debe editarse por `PUT`
- `assign`, `start`, `complete` y `cancel` deben tratarse como acciones separadas del update general
- el tecnico no debe modificar ordenes que no le fueron asignadas, salvo permiso superior
- la interfaz puede mostrar estado derivado `en ejecucion` cuando la orden persistida este en `in_progress`

### Comportamiento esperado en frontend

- flujo claro de asignacion y ejecucion
- detalle de orden con datos de cliente, equipo, solicitud y tecnico
- acciones visibles segun rol y estado
- no usar formulario general para simular cambios de estado
- si el actor es `tecnico`, solo mostrar `start` y `complete` sobre ordenes asignadas a ese tecnico
- control de cierre con confirmacion
- mostrar estado, horas y resultado de manera muy visible

### Comportamiento esperado en backend

- validar que la solicitud exista y este aprobada
- impedir cierres incompletos
- persistir responsable tecnico
- actualizar consistencia entre orden y solicitud relacionada
- exponer consulta detallada para seguimiento operativo

### Criterios minimos de aceptacion

- se puede crear una orden desde una solicitud aprobada
- se puede asignar un tecnico
- una orden terminada queda reflejada en el historial del equipo

## 11. M07 - Cronogramas

### Objetivo

Planificar actividades de mantenimiento para clientes y equipos en fechas determinadas.

### Actores

- administrador
- planeador

### Datos involucrados

- `cronogramas`
- `cronogramas_equipos`
- `clientes`
- `equipos`

### Requerimientos funcionales

- `CRO-01` El sistema debe listar cronogramas con filtros por cliente, tipo, estado y fecha.
- `CRO-02` El sistema debe permitir crear cronogramas.
- `CRO-03` El sistema debe permitir editar cronogramas.
- `CRO-04` El sistema debe permitir asociar uno o varios equipos a un cronograma.
- `CRO-05` El sistema debe permitir consultar el detalle del cronograma.
- `CRO-06` El sistema debe permitir cambiar el estado del cronograma.
- `CRO-07` El sistema debe permitir cerrar el cronograma al finalizar el ciclo previsto.

### Reglas funcionales

- el cronograma debe tener nombre, fecha y tipo
- el cliente es el contexto principal del cronograma
- se recomienda al menos un equipo asociado para que tenga sentido operativo
- equipos retirados o de baja no deben entrar en programacion preventiva ordinaria
- `sin_asignar`, `abierto` y `cerrado` son los estados base
- la secuencia operativa valida es `sin_asignar -> abierto -> cerrado`
- un cronograma `cerrado` no debe editarse ni reabrirse

### Comportamiento esperado en frontend

- calendario o listado operativo por fecha
- detalle con equipos asociados
- filtros por cliente y estado
- cambio de estado controlado y visible
- no exponer selector libre de estado en formularios
- no ofrecer `cerrar` directamente desde `sin_asignar`

### Comportamiento esperado en backend

- validar cliente y equipos asociados
- persistir relacion muchos a muchos entre cronograma y equipos
- controlar transiciones de estado
- devolver resumen por fecha y cliente para vistas operativas

### Criterios minimos de aceptacion

- se puede crear un cronograma y asociarle equipos
- el estado del cronograma puede avanzar segun la operacion
- el cronograma se puede consultar desde el cliente y desde el equipo

## 12. M08 - Historial tecnico

### Objetivo

Consolidar la memoria operativa de cada equipo para entender el ciclo de vida del servicio.

### Actores

- administrador
- planeador
- tecnico
- solicitante con alcance limitado

### Datos involucrados

- `equipos`
- `solicitudes`
- `ordenes_trabajo`
- `cronogramas`
- `calificaciones_servicio`

### Requerimientos funcionales

- `HIS-01` El sistema debe mostrar historial por equipo.
- `HIS-02` El historial debe incluir solicitudes relacionadas.
- `HIS-03` El historial debe incluir ordenes ejecutadas.
- `HIS-04` El historial debe incluir cronogramas relacionados.
- `HIS-05` El historial debe mostrar fechas, estados y responsables.
- `HIS-06` El historial debe permitir filtros por fecha y tipo de evento.

### Reglas funcionales

- el historial es de consulta, no de edicion directa
- el historial debe construirse desde registros operativos reales
- el equipo es la vista principal para consultar historial tecnico

### Comportamiento esperado en frontend

- vista cronologica clara
- filtros por periodo
- acceso rapido desde el detalle del equipo
- lectura facil del tipo de evento, responsable y resultado

### Comportamiento esperado en backend

- consolidar informacion de varias tablas
- permitir consulta eficiente por equipo
- ordenar eventos por fecha

### Criterios minimos de aceptacion

- desde un equipo se puede consultar su historial
- el historial permite entender que trabajos se hicieron y cuando
- el historial no depende de registros manuales externos

## 13. M09 - Calificacion del servicio

### Objetivo

Capturar la percepcion del usuario sobre la atencion recibida al finalizar una orden.

### Actores

- solicitante
- usuario asociado al servicio
- administrador para consulta

### Datos involucrados

- `calificaciones_servicio`
- `ordenes_trabajo`
- `usuarios`

### Requerimientos funcionales

- `CAL-01` El sistema debe permitir registrar una calificacion sobre una orden terminada.
- `CAL-02` El sistema debe permitir capturar valor de 1 a 5.
- `CAL-03` El sistema debe permitir capturar comentario opcional.
- `CAL-04` El sistema debe permitir consultar calificaciones registradas.
- `CAL-05` El sistema debe reflejar si una orden fue recibida a satisfaccion.

### Reglas funcionales

- no se debe calificar una orden anulada
- solo debe poder calificarse una orden terminada
- se recomienda una calificacion por usuario y orden
- el valor debe estar entre 1 y 5

### Comportamiento esperado en frontend

- formulario corto y simple
- visualizacion amable del puntaje
- acceso desde detalle de orden cerrada o portal del solicitante

### Comportamiento esperado en backend

- validar estado de la orden
- validar rango del puntaje
- persistir fecha de calificacion

### Criterios minimos de aceptacion

- una orden terminada puede ser calificada
- el sistema guarda puntaje y comentario
- la calificacion queda disponible para consulta administrativa

## 14. M10 - Dashboard y reportes

### Objetivo

Ofrecer visibilidad ejecutiva y operativa sobre la carga de trabajo y el comportamiento del servicio.

### Alcance

Este modulo puede implementarse despues de estabilizar los modulos operativos. No es bloqueante para el MVP, pero debe contemplarse desde la arquitectura.

### Actores

- administrador
- planeador

### Datos involucrados

- solicitudes
- ordenes
- cronogramas
- calificaciones
- equipos

### Requerimientos funcionales recomendados

- `REP-01` Mostrar cantidad de solicitudes por estado.
- `REP-02` Mostrar cantidad de ordenes por tecnico y estado.
- `REP-03` Mostrar mantenimientos programados por periodo.
- `REP-04` Mostrar calificacion promedio del servicio.
- `REP-05` Permitir filtros por cliente y fecha.

### Reglas funcionales

- los indicadores deben construirse a partir de datos reales del sistema
- el dashboard no reemplaza los modulos operativos; solo resume

### Criterios minimos de aceptacion

- el dashboard permite entender el estado general de la operacion
- los datos coinciden con lo visible en los modulos operativos

## 15. Matriz resumida de permisos por rol

La siguiente matriz es una guia base. Puede ajustarse, pero no debe romper la logica del producto.

- `Administrador`: acceso total a todos los modulos
- `Planeador`: acceso operativo a clientes, equipos, solicitudes, ordenes y cronogramas
- `Tecnico`: acceso a consulta de equipos relacionados, sus ordenes y su parte del historial
- `Solicitante`: acceso a crear solicitudes, consultar su estado y calificar el servicio

## 16. Prioridad recomendada de implementacion

Orden recomendado para construir el sistema:

1. `M01` Autenticacion y control de acceso
2. `M02` Usuarios y roles
3. `M03` Clientes
4. `M04` Equipos
5. `M05` Solicitudes
6. `M06` Ordenes de trabajo
7. `M07` Cronogramas
8. `M08` Historial tecnico
9. `M09` Calificacion del servicio
10. `M10` Dashboard y reportes

## 17. Criterios globales de aceptacion del producto

Se considera que el sistema cumple esta especificacion cuando:

- los modulos estan separados pero se conectan correctamente
- las reglas de estados se respetan
- los roles limitan correctamente las acciones
- las solicitudes pueden convertirse en ordenes
- las ordenes alimentan el historial del equipo
- los cronogramas permiten planificar mantenimiento
- la calificacion solo ocurre al finalizar el servicio

## 18. Uso de esta especificacion

### Si el proyecto empieza desde cero

Usar este documento para definir:

- backlog funcional
- estructura de modulos frontend
- estructura de modulos backend
- contratos API
- pruebas funcionales

### Si ya existe una base del proyecto

Usar este documento para revisar:

- que modulos ya existen
- que reglas no se cumplen
- que nombres y estados estan desalineados
- que pantallas y endpoints faltan
- que cambios deben priorizarse para ajustar la base

## 19. Sintesis final

La aplicacion debe comportarse como una plataforma operativa de mantenimiento donde cada modulo cumple una responsabilidad clara:

- `solicitudes` capturan la necesidad
- `ordenes` ejecutan el trabajo
- `cronogramas` planifican
- `historial` conserva memoria
- `calificaciones` miden percepcion del servicio

Si el desarrollo respeta esta especificacion, frontend y backend podran evolucionar sobre una base funcional consistente y verificable.
