const { Op } = require('sequelize')

const { ROLE_IDS, ROLE_NAMES } = require('../../auth/roles')
const {
  assertAccessibleClientFilter,
  assertClientAccess,
  buildScopedClientWhere,
  hasClientAccess,
  listScopedClientIds,
} = require('../../auth/scope')
const {
  ACTIVE_ORDER_STATUSES,
  ORDER_ACTIONS,
  assertNoManualOrderCreateTransitionFields,
  assertOrderActionAllowed,
  assertOrderCreateAllowed,
  assertOrderUpdateAllowed,
  buildAssignOrderPayload,
  buildCancelOrderPayload,
  buildCompleteOrderPayload,
  buildCreateOrderPayload,
  buildStartOrderPayload,
} = require('../../domain/operations/orderPolicy')
const { DomainError, buildDomainErrorResponse } = require('../../domain/shared/domainError')
const { Client, Equipment, Order, Request, User } = require('../../models')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const ORDER_CREATE_FIELDS = ['request_id', 'assigned_user_id', 'planned_start_at', 'diagnosis', 'closure_notes', 'received_satisfaction']
const ORDER_UPDATE_FIELDS = ['assigned_user_id', 'planned_start_at', 'diagnosis', 'closure_notes', 'received_satisfaction']
const ORDER_ASSIGN_FIELDS = ['assigned_user_id', 'planned_start_at']

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

const validateAssignedUser = async (assignedUserId, clientId = null) => {
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

  if (clientId && !assignedUser.all_clients) {
    const scopedClientIds = await listScopedClientIds(assignedUser.id)

    if (!scopedClientIds.includes(clientId)) {
      throw new DomainError(403, 'El tecnico asignado no tiene cobertura sobre ese cliente')
    }
  }

  return assignedUser
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
  const where = buildScopedClientWhere(req.auth, 'client_id')

  assertAccessibleClientFilter(req.auth, req.query.client_id)

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
    const requestsWhere = {
      requester_user_id: req.auth.userId,
      ...buildScopedClientWhere(req.auth, 'client_id'),
    }
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

  try {
    assertClientAccess(auth, order.client_id, 'Orden no encontrada')
  } catch (error) {
    throw new DomainError(404, 'Orden no encontrada')
  }

  if (auth.roleName === ROLE_NAMES.TECNICO && order.assigned_user_id !== auth.userId) {
    throw new DomainError(404, 'Orden no encontrada')
  }

  if (auth.roleName === ROLE_NAMES.SOLICITANTE) {
    const request = await Request.findByPk(order.request_id)

    if (!request) {
      throw new DomainError(404, 'La solicitud asociada no existe')
    }

    if (request.requester_user_id !== auth.userId || !hasClientAccess(auth, request.client_id)) {
      throw new DomainError(404, 'Orden no encontrada')
    }
  }

  return order
}

const getOrders = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query, {
      allowedSortFields: ['id', 'created_at', 'status', 'type', 'planned_start_at', 'started_at', 'finished_at', 'assigned_user_id'],
      defaultSort: { field: 'created_at', direction: 'DESC' },
    })
    const { count, rows } = await Order.findAndCountAll({
      where: await buildOrdersWhere(req),
      limit: pagination.limit,
      offset: pagination.offset,
      order: pagination.order,
    })
    const hydratedOrders = await Promise.all(rows.map(hydrateOrder))

    return success(res, 200, 'Obteniendo ordenes', {
      orders: hydratedOrders,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        sort: pagination.sort,
        returned: hydratedOrders.length,
      }),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'orders')
    }

    if (error instanceof PaginationQueryError) {
      return failure(res, 400, error.message, { orders: [], meta: null })
    }

    return failure(res, 500, 'No fue posible obtener ordenes', {
      orders: [],
      meta: null,
    })
  }
}

const createOrder = async (req, res) => {
  try {
    const payload = pickAllowedFields(req.body, ORDER_CREATE_FIELDS)
    assertNoManualOrderCreateTransitionFields(req.body, 'POST')

    if (!payload.request_id) {
      throw new DomainError(400, 'La orden requiere request_id')
    }

    const request = await Request.findByPk(payload.request_id)
    assertOrderCreateAllowed({
      request,
      activeOrderExists: false,
    })
    assertClientAccess(req.auth, request.client_id, 'No tienes permisos para operar sobre ese cliente')

    const activeOrder = await Order.findOne({
      where: {
        request_id: request.id,
        status: {
          [Op.in]: ACTIVE_ORDER_STATUSES,
        },
      },
    })

    assertOrderCreateAllowed({ request, activeOrderExists: Boolean(activeOrder) })

    await validateAssignedUser(payload.assigned_user_id, request.client_id)

    const orderCreate = await Order.create(
      withCreateAudit(buildCreateOrderPayload({ request, payload }), req.auth)
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

    return failure(res, 500, 'No fue posible obtener la orden', {
      order: null,
    })
  }
}

const updateOrder = async (req, res) => {
  try {
    const order = await getOrderRecord(req.params.id, req.auth)
    assertOrderUpdateAllowed({ order, payload: req.body })

    const payload = pickAllowedFields(req.body, ORDER_UPDATE_FIELDS)

    if (Object.prototype.hasOwnProperty.call(payload, 'assigned_user_id')) {
      await validateAssignedUser(payload.assigned_user_id, order.client_id)
    }

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
    assertOrderActionAllowed({
      action: ORDER_ACTIONS.ASSIGN,
      order,
      auth: req.auth,
    })

    const payload = pickAllowedFields(req.body, ORDER_ASSIGN_FIELDS)

    await validateAssignedUser(payload.assigned_user_id, order.client_id)

    await order.update(
      withUpdateAudit(buildAssignOrderPayload({ payload, order }), req.auth)
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
    assertOrderActionAllowed({
      action: ORDER_ACTIONS.START,
      order,
      auth: req.auth,
    })

    await order.update(
      withUpdateAudit(buildStartOrderPayload({ startedAt: req.body.started_at }), req.auth)
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
    assertOrderActionAllowed({
      action: ORDER_ACTIONS.COMPLETE,
      order,
      auth: req.auth,
    })

    await order.update(
      withUpdateAudit(buildCompleteOrderPayload({ body: req.body, order }), req.auth)
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
    assertOrderActionAllowed({
      action: ORDER_ACTIONS.CANCEL,
      order,
      auth: req.auth,
    })

    await order.update(
      withUpdateAudit(buildCancelOrderPayload({ body: req.body }), req.auth)
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
    return failure(res, 500, 'No fue posible eliminar la orden', {
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
