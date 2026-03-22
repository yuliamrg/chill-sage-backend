# Guia Base de Producto y Desarrollo: ChillSage

## 1. Proposito del documento

Este documento define una base unica de referencia para construir ChillSage de forma consistente en frontend y backend. Debe servir como guia durante todo el proyecto para:

- iniciar el producto desde cero
- evaluar una base ya existente y ajustarla a lo requerido
- alinear decisiones de negocio, arquitectura, datos, interfaz y comportamiento
- evitar interpretaciones distintas entre diseño, frontend, backend y base de datos

La fuente funcional principal para esta guia es la documentacion del proyecto y el modelo relacional presente en `chillsage_db.sql`. Para fijar una linea comun de desarrollo, este documento normaliza el producto alrededor de `Angular + Node.js + MySQL`.

## 2. Definicion del producto

ChillSage es una aplicacion web para gestionar la operacion de mantenimiento y servicio tecnico de equipos instalados en clientes. El sistema centraliza el ciclo completo del servicio:

- registro de clientes y usuarios relacionados
- registro de equipos o activos
- recepcion de solicitudes de servicio
- conversion de solicitudes en ordenes de trabajo
- asignacion de tecnicos
- programacion de mantenimientos
- seguimiento de ejecucion
- conservacion del historial tecnico
- evaluacion del servicio prestado

No debe tratarse como un simple sistema de tickets. El producto es una plataforma operativa de mantenimiento con foco en trazabilidad, control del trabajo tecnico y ordenamiento del servicio.

## 3. Vision del producto

ChillSage debe convertirse en la fuente oficial de operacion del servicio tecnico. Cualquier actor involucrado en la atencion, programacion, ejecucion o seguimiento de mantenimiento debe poder consultar en la aplicacion:

- que cliente solicito el servicio
- sobre que equipo se trabajo
- quien fue el responsable
- en que estado esta la atencion
- que se hizo, cuando se hizo y con que resultado
- que mantenimiento futuro esta programado

## 4. Objetivo general

Construir una plataforma web que permita administrar de forma centralizada, trazable y controlada los procesos de mantenimiento preventivo y correctivo sobre equipos de clientes.

## 5. Metas del producto

### 5.1 Metas de negocio

- reducir la dispersion de la informacion operativa
- tener trazabilidad por cliente, equipo, solicitud y orden
- mejorar la capacidad de programar mantenimientos
- controlar la atencion de servicios desde su apertura hasta su cierre
- generar una base de informacion util para decisiones futuras

### 5.2 Metas operativas

- cada solicitud debe tener un estado claro
- cada orden debe estar asociada a un tecnico o responsable definido
- cada equipo debe poder consultar su historial
- los cronogramas deben permitir planificar trabajo preventivo
- la operacion debe distinguir entre lo solicitado, lo programado y lo ejecutado

### 5.3 Metas tecnicas

- tener un modelo de datos consistente con el dominio
- separar claramente frontend, backend y persistencia
- mantener reglas de negocio en backend y no dispersas en la UI
- exponer contratos claros entre API y cliente
- permitir crecimiento por modulos sin rehacer el sistema completo

## 6. Alcance funcional

## 6.1 Alcance base obligatorio

El producto base debe cubrir como minimo:

- autenticacion
- gestion de usuarios
- gestion de clientes
- gestion de equipos
- solicitudes de servicio
- ordenes de trabajo
- cronogramas
- historial de mantenimiento
- calificacion del servicio

## 6.2 Alcance recomendado de segunda fase

- dashboard operativo
- reportes e indicadores
- adjuntos o evidencias fotograficas
- notificaciones
- bitacora o auditoria de cambios

## 6.3 Fuera de alcance inicial

Si se busca una primera version estable, no es obligatorio incluir de entrada:

- facturacion
- inventario avanzado de repuestos
- geolocalizacion en tiempo real
- automatizaciones complejas de mensajeria
- analitica avanzada

## 7. Actores del sistema

## 7.1 Administrador

Responsable de la configuracion y gobierno general del sistema.

Puede:

- crear, editar y desactivar usuarios
- administrar clientes
- consultar todos los equipos
- revisar solicitudes y ordenes
- gestionar cronogramas
- consultar calificaciones
- configurar permisos y lineamientos de uso

## 7.2 Planeador

Rol operativo intermedio identificado en el modelo de datos. Debe encargarse de coordinar programacion y ejecucion.

Puede:

- revisar solicitudes
- aprobar o anular solicitudes
- convertir solicitudes en ordenes
- asignar tecnicos
- crear y administrar cronogramas
- hacer seguimiento operativo

## 7.3 Tecnico

Ejecutor del servicio sobre equipos.

Puede:

- consultar sus ordenes asignadas
- ver el detalle del cliente y equipo
- registrar inicio y fin del trabajo
- documentar descripcion del trabajo realizado
- consultar historial relacionado con el equipo atendido

## 7.4 Solicitante

Usuario que reporta necesidades de servicio. Puede ser un usuario interno del cliente o un rol limitado dentro de la operacion.

Puede:

- crear solicitudes
- consultar el estado de sus solicitudes
- asociar la solicitud a un equipo
- calificar el servicio una vez la orden este cerrada

## 7.5 Cliente

En terminos de negocio, el cliente es la empresa o entidad atendida. En terminos de acceso, puede tener uno o varios usuarios asociados mediante `usuarios_clientes`.

## 8. Principios de producto

Estas reglas deben guiar el desarrollo completo:

- una sola fuente de verdad para estados y reglas de negocio
- trazabilidad primero: toda accion importante debe dejar datos consultables
- consistencia entre interfaz, API y base de datos
- operaciones claras: crear, consultar, actualizar, cerrar, anular
- no ocultar estados criticos ni mezclar conceptos
- separar solicitud, orden y cronograma como objetos distintos

## 9. Modelo de dominio

## 9.1 Entidades principales

### Usuario

Representa una persona que accede al sistema.

Campos principales:

- `id_usuario`
- `nombre`
- `apellidos`
- `email`
- `password_hash`
- `ubicacion`
- `telefono`
- `rol`
- `estado`
- `fecha_creacion`
- `ultima_actualizacion`

### Cliente

Representa la organizacion atendida por el servicio.

Campos principales:

- `id_cliente`
- `nombre`
- `direccion`
- `telefono`
- `email`

### UsuarioCliente

Relaciona usuarios con clientes cuando un mismo cliente tiene varios usuarios o contactos.

Campos principales:

- `id_usuario`
- `id_cliente`

### Equipo

Representa el activo intervenido o mantenido.

Campos principales:

- `id_equipo`
- `tipo`
- `marca`
- `modelo`
- `numero_serie`
- `activo_fijo`
- `ubicacion`
- `estado`
- `fecha_inicio_funcionamiento`
- `fecha_fin_funcionamiento`
- `id_cliente`
- `observaciones`

### Solicitud

Representa la necesidad inicial reportada por un solicitante.

Campos principales:

- `id_solicitud`
- `tipo`
- `id_solicitante`
- `id_equipo`
- `fecha_creacion`
- `estado`
- `descripcion`
- `observaciones`

### OrdenTrabajo

Representa la ejecucion operativa derivada de una solicitud.

Campos principales:

- `id_orden`
- `id_solicitud`
- `id_tecnico`
- `estado`
- `fecha_creacion`
- `fecha_inicio`
- `fecha_fin`
- `horas_trabajadas`
- `descripcion_trabajo`
- `recibido_satisfaccion`

### Cronograma

Representa una programacion de mantenimiento para uno o varios equipos.

Campos principales:

- `id_cronograma`
- `nombre`
- `id_cliente`
- `fecha`
- `tipo`
- `descripcion`
- `estado`

### CronogramaEquipo

Relacion entre cronogramas y equipos.

Campos principales:

- `id_cronograma`
- `id_equipo`

### CalificacionServicio

Representa la evaluacion posterior al cierre de una orden.

Campos principales:

- `id_calificacion`
- `id_orden`
- `id_usuario`
- `calificacion`
- `comentario`
- `fecha_calificacion`

## 9.2 Relaciones de negocio

- un `cliente` puede tener muchos `equipos`
- un `cliente` puede tener muchos `usuarios` asociados
- un `usuario` solicitante puede crear muchas `solicitudes`
- un `equipo` puede tener muchas `solicitudes`
- una `solicitud` puede generar una `orden de trabajo`
- un `tecnico` puede tener muchas `ordenes`
- un `cliente` puede tener muchos `cronogramas`
- un `cronograma` puede incluir muchos `equipos`
- una `orden` puede recibir una o varias `calificaciones` a nivel de modelo actual, aunque a nivel de negocio se recomienda una por usuario y orden

## 10. Modelo de estados y comportamiento

## 10.1 Estado de usuario

Valores:

- `activo`
- `inactivo`

Reglas:

- un usuario inactivo no debe poder autenticarse
- un usuario inactivo debe conservar su historial de acciones

## 10.2 Estado de equipo

Valores:

- `activo`
- `inactivo`
- `de_baja`
- `retirado`

Reglas:

- solo equipos `activos` deben poder recibir nuevas solicitudes ordinarias sin validacion adicional
- equipos `de_baja` o `retirados` deben conservar historial, pero no deberian entrar en nuevos cronogramas preventivos

## 10.3 Estado de solicitud

Valores:

- `pendiente`
- `aprobada`
- `anulada`

Transiciones esperadas:

- `pendiente -> aprobada`
- `pendiente -> anulada`

Reglas:

- una solicitud anulada no puede generar orden
- una solicitud aprobada debe quedar lista para convertirse en orden
- una solicitud no debe cambiar de equipo o solicitante despues de ser aprobada, salvo permiso administrativo

## 10.4 Estado de orden de trabajo

Valores persistidos:

- `pendiente`
- `terminada`
- `anulada`

Comportamiento esperado:

- una orden nace en `pendiente`
- una orden `pendiente` puede iniciar ejecucion registrando `fecha_inicio`
- si tiene `fecha_inicio` y no tiene `fecha_fin`, la interfaz puede mostrarla como `en ejecucion` aunque el estado persistido siga siendo `pendiente`
- una orden pasa a `terminada` cuando tiene `fecha_fin`, `descripcion_trabajo` y responsable tecnico definido
- una orden anulada no debe aceptar cierre ni calificacion

## 10.5 Estado de cronograma

Valores:

- `sin_asignar`
- `abierto`
- `cerrado`

Reglas:

- `sin_asignar` significa programado pero todavia no convertido en operacion activa
- `abierto` indica que el cronograma ya esta en ejecucion o seguimiento
- `cerrado` implica actividad completada o ciclo finalizado

## 11. Flujos funcionales obligatorios

## 11.1 Flujo de solicitud correctiva

1. El solicitante ingresa al sistema.
2. Registra una solicitud con tipo, descripcion y equipo asociado.
3. El planeador o administrador revisa la solicitud.
4. La solicitud se aprueba o anula.
5. Si se aprueba, se crea una orden de trabajo.
6. La orden se asigna a un tecnico.
7. El tecnico inicia trabajo, registra descripcion y cierre.
8. La orden alimenta el historial del equipo.
9. El solicitante o usuario autorizado puede calificar el servicio.

## 11.2 Flujo de mantenimiento programado

1. El planeador crea un cronograma para un cliente.
2. Asocia uno o varios equipos.
3. El cronograma pasa de `sin_asignar` a `abierto` cuando entra en ejecucion.
4. Las actividades ejecutadas deben poder reflejarse en ordenes o registros operativos vinculables.
5. Al finalizar, el cronograma pasa a `cerrado`.

## 11.3 Flujo de historial

1. El usuario consulta un equipo.
2. El sistema muestra sus solicitudes, ordenes y cronogramas relacionados.
3. El historial debe permitir entender que se hizo, cuando y por quien.

## 12. Reglas funcionales obligatorias

- el email del usuario debe ser unico
- el numero de serie del equipo debe ser unico
- no debe existir orden para una solicitud anulada
- se recomienda una sola orden activa por solicitud
- una orden terminada debe tener `fecha_inicio`, `fecha_fin` y `descripcion_trabajo`
- una calificacion solo debe poder registrarse sobre una orden terminada
- un tecnico no debe cerrar una orden que no le fue asignada, salvo permisos administrativos
- un solicitante solo debe ver solicitudes y ordenes de su cliente o de su propio alcance
- un equipo retirado no debe aparecer como seleccion principal en nuevas programaciones preventivas
- no se deben eliminar fisicamente registros operativos criticos salvo necesidad legal o tecnica muy justificada
- todos los modulos deben respetar fechas de creacion y actualizacion cuando existan

## 13. Reglas de implementacion

- la logica de negocio debe vivir en backend
- el frontend no debe decidir por si solo transiciones criticas
- los enums y estados deben centralizarse y compartirse por contrato
- los formularios deben validar antes de enviar, pero el backend debe validar siempre de nuevo
- la API no debe exponer `password_hash`
- las acciones sensibles deben requerir autenticacion y autorizacion
- los nombres de campos y recursos deben mantenerse consistentes entre UI, API y BD
- si el sistema ya existe, se deben adaptar nombres y estructuras internas sin romper la semantica de este documento

## 14. Arquitectura recomendada

## 14.1 Vista general

La arquitectura recomendada para ChillSage es una arquitectura web en tres capas:

- `frontend` SPA para experiencia de usuario y operacion diaria
- `backend` API para autenticacion, reglas de negocio y orquestacion
- `base de datos` relacional para persistencia y consulta historica

## 14.2 Arquitectura del backend

Se recomienda una arquitectura modular por dominio con separacion por capas:

- `api`: controladores, rutas, middlewares, validaciones de entrada
- `application`: casos de uso y servicios de aplicacion
- `domain`: entidades, enums, reglas, puertos
- `infrastructure`: repositorios, ORM o SQL, adaptadores externos

Estructura sugerida:

```text
src/
  modules/
    auth/
    usuarios/
    clientes/
    equipos/
    solicitudes/
    ordenes-trabajo/
    cronogramas/
    calificaciones/
  shared/
    domain/
    application/
    infrastructure/
    http/
  config/
```

### Recomendaciones backend

- usar API REST con recursos claros
- autenticar mediante token de acceso y politicas de expiracion consistentes
- separar DTOs, entidades, repositorios y servicios
- registrar validaciones y errores de dominio con mensajes claros
- no mezclar consultas SQL crudas con logica de negocio en controladores
- diseñar el backend para que pueda crecer hacia reportes y auditoria

## 14.3 Arquitectura del frontend

Se recomienda un frontend Angular orientado por funcionalidades y no solo por tipo de archivo.

Estructura sugerida:

```text
src/app/
  core/
    auth/
    guards/
    interceptors/
    layout/
    services/
  shared/
    ui/
    models/
    utils/
    pipes/
  features/
    dashboard/
    usuarios/
    clientes/
    equipos/
    solicitudes/
    ordenes/
    cronogramas/
    historial/
    calificaciones/
```

### Recomendaciones frontend

- usar Angular moderno con enfoque `feature-first`
- preferir componentes standalone si el proyecto arranca desde cero
- usar guards por autenticacion y rol
- centralizar modelos, enums y clientes HTTP
- manejar estado de UI localmente por modulo y no globalizar todo sin necesidad
- construir vistas de lista, detalle, formulario y seguimiento para cada modulo principal
- reflejar estados con etiquetas visuales consistentes

## 14.4 Contrato entre frontend y backend

El frontend debe consumir recursos consistentes y previsibles. Como base, los modulos deben mapearse a endpoints equivalentes:

- `/auth`
- `/usuarios`
- `/clientes`
- `/equipos`
- `/solicitudes`
- `/ordenes-trabajo`
- `/cronogramas`
- `/calificaciones`

Cada recurso debe soportar al menos:

- listado paginado o filtrable
- consulta por identificador
- creacion
- actualizacion
- cambio de estado cuando aplique

## 15. Mapa de clases y servicios recomendados

## 15.1 Clases o entidades de dominio backend

Estas clases deben existir como minimo a nivel de dominio, modelo o entidad:

- `Usuario`
- `Cliente`
- `UsuarioCliente`
- `Equipo`
- `Solicitud`
- `OrdenTrabajo`
- `Cronograma`
- `CronogramaEquipo`
- `CalificacionServicio`

Enums recomendados:

- `RolUsuario`
- `EstadoUsuario`
- `EstadoEquipo`
- `TipoSolicitud`
- `EstadoSolicitud`
- `EstadoOrdenTrabajo`
- `TipoCronograma`
- `EstadoCronograma`

## 15.2 Servicios de aplicacion backend

Servicios o casos de uso recomendados:

- `AuthService`
- `UsuarioService`
- `ClienteService`
- `EquipoService`
- `SolicitudService`
- `OrdenTrabajoService`
- `CronogramaService`
- `CalificacionService`
- `HistorialService`

Casos de uso clave:

- autenticar usuario
- crear solicitud
- aprobar solicitud
- anular solicitud
- crear orden desde solicitud
- asignar tecnico a orden
- iniciar orden
- cerrar orden
- crear cronograma
- asociar equipos a cronograma
- cerrar cronograma
- calificar servicio
- consultar historial de equipo

## 15.3 Interfaces y modelos frontend

Modelos de UI y consumo API recomendados:

- `UsuarioModel`
- `ClienteModel`
- `EquipoModel`
- `SolicitudModel`
- `OrdenTrabajoModel`
- `CronogramaModel`
- `CalificacionModel`

View models utiles:

- `SolicitudListItem`
- `OrdenDetalleViewModel`
- `EquipoHistorialViewModel`
- `CronogramaResumenViewModel`
- `DashboardMetricViewModel`

## 15.4 Componentes y paginas frontend

Paginas base recomendadas:

- login
- dashboard
- listado de usuarios
- formulario de usuario
- listado de clientes
- formulario de cliente
- listado de equipos
- detalle de equipo con historial
- listado de solicitudes
- formulario de solicitud
- detalle de solicitud
- listado de ordenes
- detalle y cierre de orden
- listado de cronogramas
- formulario de cronograma
- modulo de calificacion

## 16. Diseno y experiencia de usuario

## 16.1 Principios de diseno

La interfaz debe transmitir:

- control operativo
- orden
- claridad tecnica
- sobriedad visual

El sistema no debe sentirse como una landing o un producto de consumo. Debe funcionar como una herramienta de operacion diaria.

## 16.2 Lineamientos visuales

- usar la identidad de marca ya definida por logo y paleta existente
- convertir la paleta a tokens de color reutilizables
- usar colores de estado consistentes para `pendiente`, `terminada`, `anulada`, `activo`, `inactivo`, `cerrado`
- priorizar tablas, filtros, formularios claros y paneles de detalle
- mantener alta legibilidad y jerarquia visual estable

## 16.3 Navegacion recomendada

Navegacion lateral o superior por modulos:

- inicio
- usuarios
- clientes
- equipos
- solicitudes
- ordenes de trabajo
- cronogramas
- historial
- calificaciones

La navegacion debe cambiar segun el rol.

## 16.4 Comportamiento esperado de la UI

- mostrar estados visibles en listas y detalles
- evitar acciones invalidas segun el estado del registro
- mostrar confirmacion en cambios criticos como anular o cerrar
- mantener filtros por cliente, tecnico, estado y fecha
- exponer el historial de forma cronologica y facil de leer

## 16.5 Accesibilidad minima

- contraste adecuado
- formularios con etiquetas claras
- mensajes de error comprensibles
- navegacion por teclado en acciones clave
- no depender solo del color para representar estados

## 17. Validaciones clave por modulo

## 17.1 Usuarios

- nombre y apellidos obligatorios
- email obligatorio y unico
- rol obligatorio
- password obligatoria al crear

## 17.2 Clientes

- nombre obligatorio
- medios de contacto recomendados

## 17.3 Equipos

- tipo, marca, modelo y numero de serie obligatorios
- numero de serie unico
- ubicacion obligatoria
- cliente asociado obligatorio en operacion normal

## 17.4 Solicitudes

- tipo obligatorio
- descripcion obligatoria
- solicitante obligatorio
- equipo recomendado u obligatorio segun el flujo operativo definido

## 17.5 Ordenes

- solicitud asociada obligatoria
- tecnico asignado recomendado antes de iniciar
- descripcion de trabajo obligatoria al cerrar

## 17.6 Cronogramas

- nombre obligatorio
- fecha obligatoria
- tipo obligatorio
- cliente recomendado
- al menos un equipo asociado en la operacion real

## 17.7 Calificaciones

- valor entre 1 y 5
- solo despues del cierre de la orden

## 18. Requisitos no funcionales

## 18.1 Seguridad

- contraseñas cifradas con hash seguro
- control de acceso por rol
- proteccion de rutas y endpoints
- auditoria futura de acciones sensibles

## 18.2 Rendimiento

- listados filtrables y paginables
- indices en claves de relacion y busqueda
- consultas historicas optimizadas por cliente, equipo y fechas

## 18.3 Mantenibilidad

- modulos desacoplados
- nombres consistentes
- bajo acoplamiento entre capas
- codigo orientado a dominio y no solo a pantallas

## 18.4 Escalabilidad funcional

La arquitectura debe permitir agregar despues:

- reportes
- dashboard gerencial
- notificaciones
- adjuntos
- inventario o repuestos

## 19. Hoja de ruta recomendada de construccion

## 19.1 Si el proyecto empieza desde cero

Orden recomendado:

1. autenticacion y estructura base
2. usuarios y roles
3. clientes
4. equipos
5. solicitudes
6. ordenes de trabajo
7. cronogramas
8. historial
9. calificaciones
10. reportes y mejoras operativas

## 19.2 Si ya existe una base

Proceso recomendado:

1. inventariar modulos existentes
2. mapear entidades actuales contra este documento
3. detectar diferencias de estados, nombres y reglas
4. ajustar contratos API y modelos UI
5. unificar flujos antes de agregar nuevas funcionalidades
6. corregir deuda tecnica que rompa la trazabilidad o consistencia

## 20. Criterios de alineacion del proyecto

Se considera que una implementacion esta alineada con ChillSage cuando:

- el dominio principal coincide con las entidades y relaciones de este documento
- los estados y transiciones se comportan como aqui se define
- frontend y backend comparten la misma semantica operativa
- el sistema permite seguir el ciclo completo desde solicitud hasta cierre
- el historial por equipo es consultable
- la programacion por cronogramas esta soportada
- los roles restringen correctamente el acceso

## 21. Sintesis ejecutiva

ChillSage debe construirse como una plataforma web de operacion de mantenimiento, no como un conjunto aislado de pantallas. La separacion clave del producto es:

- `solicitud`: expresa una necesidad o requerimiento
- `orden de trabajo`: expresa la ejecucion concreta del servicio
- `cronograma`: expresa la planificacion de actividades futuras o recurrentes
- `historial`: expresa la memoria operativa del equipo y del servicio

Si frontend y backend respetan esa separacion, junto con las entidades, estados y reglas aqui definidos, el proyecto tendra una base clara y sostenible para evolucionar.
