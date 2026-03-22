const { Op } = require('sequelize')

const { ROLE_IDS, ROLE_NAMES } = require('../../auth/roles')
const { Client, Equipment, Order, Request, User } = require('../../models')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const ORDER_CREATE_FIELDS = ['request_id', 'assigned_user_id', 'planned_start_at', 'diagnosis', 'closure_notes', 'received_satisfaction']
const ORDER_UPDATE_FIELDS = ['assigned_user_id', 'planned_start_at', 'diagnosis', 'closure_notes', 'received_satisfaction']
const ORDER_ASSIGN_FIELDS = ['assigned_user_id', 'planned_start_at']
const ORDER_STATUSES = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

class DomainError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'DomainError'
    this.statusCode = statusCode
  }
}

const buildDomainErrorResponse = (res, error, payloadKey) =>
  failure(res, error.statusCode || 400, error.message, { [payloadKey]: null })

const parseDateRange = (value, fieldName) => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError(400, `La fecha enviada para "${fieldName}" no es valida`)
  }

  return parsed
}

const getUserScope = async (auth) => {
  const user = await User.findByPk(auth.userId)

  if (!user) {
    throw new DomainError(401, 'Usuario autenticado no encontrado')
  }

  return user
}

const validateAssignedUser = async (assignedUserId) => {
  if (!assignedUserId) {
    return null
  }

  const assignedUser = await User.findByPk(assignedUserId)

  if (!assignedUser) {
    throw new DomainError(400, 'El tecnico asignado no existe')
  }

  if (assignedUser.status !== 'active') {
    throw new DomainError(400, 'El tecnico asignado no esta activo')
  }

  if (assignedUser.role !== ROLE_IDS.TECNICO) {
    throw new DomainError(400, 'La orden solo puede asignarse a usuarios tecnicos')
  }

  return assignedUser
}

const validateOrderTimes = (payload) => {
  if (payload.started_at && payload.finished_at && payload.finished_at < payload.started_at) {
    throw new DomainError(400, 'finished_at no puede ser anterior a started_at')
  }
}

const hydrateOrder = async (order) => {
  if (!order) {
    return null
  }

  const orderData = typeof order.toJSON === 'function' ? order.toJSON() : order
  const [assignedUser, request, client, equipment] = await Promise.all([
    orderData.assigned_user_id ? User.findByPk(orderData.assigned_user_id) : null,
    orderData.request_id ? Request.findByPk(orderData.request_id) : null,
    orderData.client_id ? Client.findByPk(orderData.client_id) : null,
    orderData.equipment_id ? Equipment.findByPk(orderData.equipment_id) : null,
  ])

  return {
    ...orderData,
    assigned_user_name: assignedUser ? [assignedUser.name, assignedUser.last_name].filter(Boolean).join(' ') || assignedUser.username : null,
    request_summary: request?.title ?? request?.description ?? null,
    request_status: request?.status ?? null,
    client_name: client?.name ?? null,
    equipment_name: equipment?.name ?? null,
    equipment_code: equipment?.code ?? null,
  }
}

const buildOrdersWhere = async (req) => {
  const where = {}

  if (req.query.client_id) {
    where.client_id = Number(req.query.client_id)
  }

  if (req.query.equipment_id) {
    where.equipment_id = Number(req.query.equipment_id)
  }

  if (req.query.assigned_user_id) {
    where.assigned_user_id = Number(req.query.assigned_user_id)
  }

  if (req.query.status) {
    where.status = req.query.status
  }

  if (req.query.type) {
    where.type = req.query.type
  }

  const dateFrom = parseDateRange(req.query.date_from, 'date_from')
  const dateTo = parseDateRange(req.query.date_to, 'date_to')

  if (dateFrom || dateTo) {
    where.created_at = {}

    if (dateFrom) {
      where.created_at[Op.gte] = dateFrom
    }

    if (dateTo) {
      where.created_at[Op.lte] = dateTo
    }
  }

  if (req.auth.roleName === ROLE_NAMES.TECNICO) {
    where.assigned_user_id = req.auth.userId
  }

  if (req.auth.roleName === ROLE_NAMES.SOLICITANTE) {
    const authUser = await getUserScope(req.auth)
    const requestsWhere = authUser.client
      ? { [Op.or]: [{ requester_user_id: req.auth.userId }, { client_id: authUser.client }] }
      : { requester_user_id: req.auth.userId }
    const requests = await Request.findAll({ where: requestsWhere, attributes: ['id'] })
    const requestIds = requests.map((request) => request.id)

    where.request_id = requestIds.length ? { [Op.in]: requestIds } : -1
  }

  return where
}

const getOrderRecord = async (id, auth) => {
  const order = await Order.findByPk(id)

  if (!order) {
    throw new DomainError(404, 'Orden no encontrada')
  }

  if (auth.roleName === ROLE_NAMES.TECNICO && order.assigned_user_id !== auth.userId) {
    throw new DomainError(403, 'No tienes permisos para consultar esta orden')
  }

  if (auth.roleName === ROLE_NAMES.SOLICITANTE) {
    const authUser = await getUserScope(auth)
    const request = await Request.findByPk(order.request_id)

    if (!request) {
      throw new DomainError(404, 'La solicitud asociada no existe')
    }

    if (request.requester_user_id !== auth.userId && (!authUser.client || request.client_id !== authUser.client)) {
      throw new DomainError(403, 'No tienes permisos para consultar esta orden')
    }
  }

  return order
}

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: await buildOrdersWhere(req),
      order: [['created_at', 'DESC'], ['id', 'DESC']],
    })
    const hydratedOrders = await Promise.all(orders.map(hydrateOrder))

    return success(res, 200, 'Obteniendo ordenes', {
      orders: hydratedOrders,
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'orders')
    }

    return failure(res, 500, 'Error al conectar con el controlador order:' + error.message, {
      orders: [],
    })
  }
}

const createOrder = async (req, res) => {
  try {
    const payload = pickAllowedFields(req.body, ORDER_CREATE_FIELDS)

    if (!payload.request_id) {
      throw new DomainError(400, 'La orden requiere request_id')
    }

    const request = await Request.findByPk(payload.request_id)

    if (!request) {
      throw new DomainError(400, 'La solicitud origen no existe')
    }

    if (request.status !== 'approved') {
      throw new DomainError(409, 'La orden solo puede crearse desde una solicitud aprobada')
    }

    const activeOrder = await Order.findOne({
      where: {
        request_id: request.id,
        status: {
          [Op.in]: [ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.IN_PROGRESS],
        },
      },
    })

    if (activeOrder) {
      throw new DomainError(409, 'La solicitud ya tiene una orden activa')
    }

    await validateAssignedUser(payload.assigned_user_id)

    const orderCreate = await Order.create(
      withCreateAudit(
        {
          request_id: request.id,
          client_id: request.client_id,
          equipment_id: request.equipment_id,
          type: request.type,
          assigned_user_id: payload.assigned_user_id || null,
          planned_start_at: payload.planned_start_at || null,
          diagnosis: payload.diagnosis || null,
          closure_notes: payload.closure_notes || null,
          received_satisfaction: payload.received_satisfaction ?? null,
          status: ORDER_STATUSES.ASSIGNED,
        },
        req.auth
      )
    )

    return success(res, 201, 'Orden creada con exito', {
      order: await hydrateOrder(orderCreate),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'order')
    }

    return handleRequestError({
      context: 'orders.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear la orden: ',
      payloadKey: 'order',
    })
  }
}

const getOrderById = async (req, res) => {
  try {
    const order = await getOrderRecord(req.params.id, req.auth)

    return success(res, 200, 'Orden encontrada', {
      order: await hydrateOrder(order),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'order')
    }

    return failure(res, 500, 'Error al obtener la orden: ' + error.message, {
      order: null,
    })
  }
}

const updateOrder = async (req, res) => {
  try {
    const order = await getOrderRecord(req.params.id, req.auth)

    if (order.status === ORDER_STATUSES.COMPLETED || order.status === ORDER_STATUSES.CANCELLED) {
      throw new DomainError(409, 'No se puede editar una orden completada o cancelada')
    }

    const payload = pickAllowedFields(req.body, ORDER_UPDATE_FIELDS)

    if (Object.prototype.hasOwnProperty.call(payload, 'assigned_user_id')) {
      await validateAssignedUser(payload.assigned_user_id)
    }

    validateOrderTimes({
      started_at: order.started_at,
      finished_at: order.finished_at,
    })

    await order.update(withUpdateAudit(payload, req.auth))

    return success(res, 200, 'Orden actualizada con exito', {
      order: await hydrateOrder(order),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'order')
    }

    return handleRequestError({
      context: 'orders.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar la orden: ',
      payloadKey: 'order',
    })
  }
}

const assignOrder = async (req, res) => {
  try {
    const order = await getOrderRecord(req.params.id, req.auth)

    if (order.status === ORDER_STATUSES.COMPLETED || order.status === ORDER_STATUSES.CANCELLED) {
      throw new DomainError(409, 'No se puede asignar una orden completada o cancelada')
    }

    const payload = pickAllowedFields(req.body, ORDER_ASSIGN_FIELDS)

    if (!payload.assigned_user_id) {
      throw new DomainError(400, 'La asignacion requiere assigned_user_id')
    }

    await validateAssignedUser(payload.assigned_user_id)

    await order.update(
      withUpdateAudit(
        {
          assigned_user_id: payload.assigned_user_id,
          planned_start_at: payload.planned_start_at || order.planned_start_at,
          status: order.status === ORDER_STATUSES.CANCELLED ? ORDER_STATUSES.CANCELLED : ORDER_STATUSES.ASSIGNED,
        },
        req.auth
      )
    )

    return success(res, 200, 'Orden asignada con exito', {
      order: await hydrateOrder(order),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'order')
    }

    return handleRequestError({
      context: 'orders.assign',
      req,
      res,
      error,
      fallbackMessage: 'Error al asignar la orden: ',
      payloadKey: 'order',
    })
  }
}

const startOrder = async (req, res) => {
  try {
    const order = await getOrderRecord(req.params.id, req.auth)

    if (order.status !== ORDER_STATUSES.ASSIGNED) {
      throw new DomainError(409, 'Solo se pueden iniciar ordenes asignadas')
    }

    if (!order.assigned_user_id) {
      throw new DomainError(409, 'La orden debe tener un tecnico asignado antes de iniciar')
    }

    if (req.auth.roleName === ROLE_NAMES.TECNICO && order.assigned_user_id !== req.auth.userId) {
      throw new DomainError(403, 'Solo el tecnico asignado puede iniciar esta orden')
    }

    await order.update(
      withUpdateAudit(
        {
          status: ORDER_STATUSES.IN_PROGRESS,
          started_at: req.body.started_at || new Date(),
        },
        req.auth
      )
    )

    return success(res, 200, 'Orden iniciada con exito', {
      order: await hydrateOrder(order),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'order')
    }

    return handleRequestError({
      context: 'orders.start',
      req,
      res,
      error,
      fallbackMessage: 'Error al iniciar la orden: ',
      payloadKey: 'order',
    })
  }
}

const completeOrder = async (req, res) => {
  try {
    const order = await getOrderRecord(req.params.id, req.auth)

    if (order.status !== ORDER_STATUSES.IN_PROGRESS) {
      throw new DomainError(409, 'Solo se pueden completar ordenes en ejecucion')
    }

    if (req.auth.roleName === ROLE_NAMES.TECNICO && order.assigned_user_id !== req.auth.userId) {
      throw new DomainError(403, 'Solo el tecnico asignado puede completar esta orden')
    }

    const completionPayload = {
      finished_at: req.body.finished_at ? new Date(req.body.finished_at) : new Date(),
      worked_hours: req.body.worked_hours,
      work_description: req.body.work_description?.trim(),
      closure_notes: req.body.closure_notes ?? order.closure_notes,
      diagnosis: req.body.diagnosis ?? order.diagnosis,
      received_satisfaction: req.body.received_satisfaction ?? order.received_satisfaction,
      status: ORDER_STATUSES.COMPLETED,
    }

    if (!completionPayload.work_description) {
      throw new DomainError(400, 'El cierre requiere work_description')
    }

    if (!order.assigned_user_id) {
      throw new DomainError(409, 'La orden debe tener un tecnico asignado')
    }

    if (!order.started_at) {
      throw new DomainError(409, 'La orden debe tener started_at antes de completarse')
    }

    if (completionPayload.worked_hours == null) {
      throw new DomainError(400, 'El cierre requiere worked_hours')
    }

    if (Number(completionPayload.worked_hours) < 0) {
      throw new DomainError(400, 'worked_hours debe ser un numero positivo')
    }

    validateOrderTimes({
      started_at: order.started_at,
      finished_at: completionPayload.finished_at,
    })

    await order.update(
      withUpdateAudit(
        {
          finished_at: completionPayload.finished_at,
          worked_hours: Number(completionPayload.worked_hours),
          work_description: completionPayload.work_description,
          closure_notes: completionPayload.closure_notes,
          diagnosis: completionPayload.diagnosis,
          received_satisfaction: completionPayload.received_satisfaction,
          status: completionPayload.status,
        },
        req.auth
      )
    )

    return success(res, 200, 'Orden completada con exito', {
      order: await hydrateOrder(order),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'order')
    }

    return handleRequestError({
      context: 'orders.complete',
      req,
      res,
      error,
      fallbackMessage: 'Error al completar la orden: ',
      payloadKey: 'order',
    })
  }
}

const cancelOrder = async (req, res) => {
  try {
    const order = await getOrderRecord(req.params.id, req.auth)

    if (order.status === ORDER_STATUSES.COMPLETED) {
      throw new DomainError(409, 'No se puede cancelar una orden completada')
    }

    if (!req.body.cancel_reason?.trim()) {
      throw new DomainError(400, 'La cancelacion requiere cancel_reason')
    }

    await order.update(
      withUpdateAudit(
        {
          status: ORDER_STATUSES.CANCELLED,
          cancel_reason: req.body.cancel_reason.trim(),
        },
        req.auth
      )
    )

    return success(res, 200, 'Orden cancelada con exito', {
      order: await hydrateOrder(order),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'order')
    }

    return handleRequestError({
      context: 'orders.cancel',
      req,
      res,
      error,
      fallbackMessage: 'Error al cancelar la orden: ',
      payloadKey: 'order',
    })
  }
}

const destroyOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id)

    if (!order) {
      return failure(res, 404, 'Orden no encontrada', { order: null })
    }

    await order.destroy()

    return success(res, 200, 'Orden eliminada con exito', {
      order: await hydrateOrder(order),
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar la orden: ' + error.message, {
      order: null,
    })
  }
}

module.exports = {
  assignOrder,
  cancelOrder,
  completeOrder,
  createOrder,
  destroyOrder,
  getOrderById,
  getOrders,
  startOrder,
  updateOrder,
}
