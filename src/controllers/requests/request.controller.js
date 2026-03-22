const { Op } = require('sequelize')

const { ROLE_NAMES } = require('../../auth/roles')
const { Client, Equipment, Order, Request, User } = require('../../models')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const REQUEST_CREATE_FIELDS = ['client_id', 'requester_user_id', 'equipment_id', 'type', 'title', 'description', 'priority']
const REQUEST_UPDATE_FIELDS = ['client_id', 'requester_user_id', 'equipment_id', 'type', 'title', 'description', 'priority']
const REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
}
const REQUEST_TYPES = new Set(['corrective', 'preventive', 'inspection', 'installation'])
const REQUEST_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])

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

const getEquipmentForClient = async (equipmentId, clientId) => {
  const equipment = await Equipment.findByPk(equipmentId)

  if (!equipment) {
    throw new DomainError(400, 'El equipo asociado no existe')
  }

  if (clientId && equipment.client !== clientId) {
    throw new DomainError(400, 'El equipo no pertenece al cliente indicado')
  }

  return equipment
}

const validateRequestTypeAndPriority = (payload) => {
  if (payload.type && !REQUEST_TYPES.has(payload.type)) {
    throw new DomainError(400, 'El tipo de solicitud no es valido')
  }

  if (payload.priority && !REQUEST_PRIORITIES.has(payload.priority)) {
    throw new DomainError(400, 'La prioridad de la solicitud no es valida')
  }
}

const validateRequester = async (requesterUserId) => {
  if (!requesterUserId) {
    throw new DomainError(400, 'La solicitud requiere un solicitante asociado')
  }

  const requester = await User.findByPk(requesterUserId)

  if (!requester) {
    throw new DomainError(400, 'El solicitante asociado no existe')
  }

  if (requester.status !== 'active') {
    throw new DomainError(400, 'El solicitante asociado no esta activo')
  }

  return requester
}

const resolveCreatePayload = async (req) => {
  const payload = pickAllowedFields(req.body, REQUEST_CREATE_FIELDS)
  const authUser = await getUserScope(req.auth)

  if (req.auth.roleName === ROLE_NAMES.SOLICITANTE) {
    payload.requester_user_id = req.auth.userId
  }

  if (!payload.requester_user_id) {
    payload.requester_user_id = req.auth.userId
  }

  await validateRequester(payload.requester_user_id)

  if (!payload.client_id) {
    payload.client_id = authUser.client || null
  }

  if (!payload.client_id) {
    throw new DomainError(400, 'La solicitud requiere client_id')
  }

  if (!payload.equipment_id) {
    throw new DomainError(400, 'La solicitud requiere equipment_id')
  }

  if (!payload.title?.trim()) {
    throw new DomainError(400, 'La solicitud requiere title')
  }

  if (!payload.description?.trim()) {
    throw new DomainError(400, 'La solicitud requiere description')
  }

  payload.type = payload.type || 'corrective'
  payload.priority = payload.priority || 'medium'
  payload.status = REQUEST_STATUSES.PENDING
  payload.requested_at = new Date()

  validateRequestTypeAndPriority(payload)

  const client = await Client.findByPk(payload.client_id)

  if (!client) {
    throw new DomainError(400, 'El cliente asociado no existe')
  }

  await getEquipmentForClient(payload.equipment_id, payload.client_id)

  return payload
}

const resolveUpdatePayload = async (req, existingRequest) => {
  const payload = pickAllowedFields(req.body, REQUEST_UPDATE_FIELDS)

  if (existingRequest.status !== REQUEST_STATUSES.PENDING && req.auth.roleName !== ROLE_NAMES.ADMIN) {
    throw new DomainError(409, 'Solo se pueden editar solicitudes pendientes')
  }

  const nextPayload = {
    ...existingRequest.toJSON(),
    ...payload,
  }

  if (!nextPayload.client_id) {
    throw new DomainError(400, 'La solicitud requiere client_id')
  }

  if (!nextPayload.requester_user_id) {
    throw new DomainError(400, 'La solicitud requiere requester_user_id')
  }

  if (!nextPayload.equipment_id) {
    throw new DomainError(400, 'La solicitud requiere equipment_id')
  }

  if (!nextPayload.title?.trim()) {
    throw new DomainError(400, 'La solicitud requiere title')
  }

  if (!nextPayload.description?.trim()) {
    throw new DomainError(400, 'La solicitud requiere description')
  }

  validateRequestTypeAndPriority(nextPayload)
  await validateRequester(nextPayload.requester_user_id)

  const client = await Client.findByPk(nextPayload.client_id)

  if (!client) {
    throw new DomainError(400, 'El cliente asociado no existe')
  }

  await getEquipmentForClient(nextPayload.equipment_id, nextPayload.client_id)

  return payload
}

const buildRequestWhere = async (req) => {
  const where = {}
  const authUser = await getUserScope(req.auth)

  if (req.query.client_id) {
    where.client_id = Number(req.query.client_id)
  }

  if (req.query.requester_user_id) {
    where.requester_user_id = Number(req.query.requester_user_id)
  }

  if (req.query.equipment_id) {
    where.equipment_id = Number(req.query.equipment_id)
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
    where.requested_at = {}

    if (dateFrom) {
      where.requested_at[Op.gte] = dateFrom
    }

    if (dateTo) {
      where.requested_at[Op.lte] = dateTo
    }
  }

  if (req.auth.roleName === ROLE_NAMES.SOLICITANTE) {
    const scope = [{ requester_user_id: req.auth.userId }]

    if (authUser.client) {
      scope.push({ client_id: authUser.client })
    }

    where[Op.and] = [...(where[Op.and] || []), { [Op.or]: scope }]
  }

  return where
}

const enrichRequest = async (request) => {
  if (!request) {
    return null
  }

  const requestData = typeof request.toJSON === 'function' ? request.toJSON() : request
  const [client, requester, equipment, order] = await Promise.all([
    requestData.client_id ? Client.findByPk(requestData.client_id) : null,
    requestData.requester_user_id ? User.findByPk(requestData.requester_user_id) : null,
    requestData.equipment_id ? Equipment.findByPk(requestData.equipment_id) : null,
    Order.findOne({ where: { request_id: requestData.id }, order: [['id', 'DESC']] }),
  ])

  return {
    ...requestData,
    client_name: client?.name ?? null,
    requester_name: requester ? [requester.name, requester.last_name].filter(Boolean).join(' ') || requester.username : null,
    equipment_name: equipment?.name ?? null,
    equipment_code: equipment?.code ?? null,
    order_id: order?.id ?? null,
    order_status: order?.status ?? null,
  }
}

const getRequestRecord = async (id, auth) => {
  const request = await Request.findByPk(id)

  if (!request) {
    throw new DomainError(404, 'Solicitud no encontrada')
  }

  if (auth.roleName === ROLE_NAMES.SOLICITANTE) {
    const authUser = await getUserScope(auth)

    if (request.requester_user_id !== auth.userId && (!authUser.client || request.client_id !== authUser.client)) {
      throw new DomainError(403, 'No tienes permisos para consultar esta solicitud')
    }
  }

  return request
}

const getRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      where: await buildRequestWhere(req),
      order: [['requested_at', 'DESC'], ['id', 'DESC']],
    })
    const hydratedRequests = await Promise.all(requests.map(enrichRequest))

    return success(res, 200, 'Obteniendo solicitudes', {
      requests: hydratedRequests,
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'requests')
    }

    return failure(res, 500, 'Error al conectar con el controlador request:' + error.message, {
      requests: [],
    })
  }
}

const createRequest = async (req, res) => {
  try {
    const requestCreate = await Request.create(withCreateAudit(await resolveCreatePayload(req), req.auth))

    return success(res, 201, 'Solicitud creada con exito', {
      request: await enrichRequest(requestCreate),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'request')
    }

    return handleRequestError({
      context: 'requests.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear la solicitud: ',
      payloadKey: 'request',
    })
  }
}

const getRequestById = async (req, res) => {
  try {
    const request = await getRequestRecord(req.params.id, req.auth)

    return success(res, 200, 'Solicitud encontrada', {
      request: await enrichRequest(request),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'request')
    }

    return failure(res, 500, 'Error al obtener la solicitud: ' + error.message, {
      request: null,
    })
  }
}

const updateRequest = async (req, res) => {
  try {
    const request = await getRequestRecord(req.params.id, req.auth)
    const payload = await resolveUpdatePayload(req, request)

    await request.update(withUpdateAudit(payload, req.auth))

    return success(res, 200, 'Solicitud actualizada con exito', {
      request: await enrichRequest(request),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'request')
    }

    return handleRequestError({
      context: 'requests.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar la solicitud: ',
      payloadKey: 'request',
    })
  }
}

const approveRequest = async (req, res) => {
  try {
    const request = await getRequestRecord(req.params.id, req.auth)

    if (request.status !== REQUEST_STATUSES.PENDING) {
      throw new DomainError(409, 'Solo se pueden aprobar solicitudes pendientes')
    }

    await request.update(
      withUpdateAudit(
        {
          status: REQUEST_STATUSES.APPROVED,
          reviewed_at: new Date(),
          reviewed_by_user_id: req.auth.userId,
          review_notes: req.body.review_notes || null,
          cancel_reason: null,
        },
        req.auth
      )
    )

    return success(res, 200, 'Solicitud aprobada con exito', {
      request: await enrichRequest(request),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'request')
    }

    return handleRequestError({
      context: 'requests.approve',
      req,
      res,
      error,
      fallbackMessage: 'Error al aprobar la solicitud: ',
      payloadKey: 'request',
    })
  }
}

const cancelRequest = async (req, res) => {
  try {
    const request = await getRequestRecord(req.params.id, req.auth)

    if (request.status !== REQUEST_STATUSES.PENDING) {
      throw new DomainError(409, 'Solo se pueden anular solicitudes pendientes')
    }

    if (!req.body.cancel_reason?.trim()) {
      throw new DomainError(400, 'La anulacion requiere cancel_reason')
    }

    const relatedOrder = await Order.findOne({ where: { request_id: request.id } })

    if (relatedOrder) {
      throw new DomainError(409, 'La solicitud ya genero una orden y no puede anularse')
    }

    await request.update(
      withUpdateAudit(
        {
          status: REQUEST_STATUSES.CANCELLED,
          reviewed_at: new Date(),
          reviewed_by_user_id: req.auth.userId,
          review_notes: req.body.review_notes || null,
          cancel_reason: req.body.cancel_reason.trim(),
        },
        req.auth
      )
    )

    return success(res, 200, 'Solicitud anulada con exito', {
      request: await enrichRequest(request),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'request')
    }

    return handleRequestError({
      context: 'requests.cancel',
      req,
      res,
      error,
      fallbackMessage: 'Error al anular la solicitud: ',
      payloadKey: 'request',
    })
  }
}

const destroyRequest = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id)

    if (!request) {
      return failure(res, 404, 'Solicitud no encontrada', { request: null })
    }

    await request.destroy()

    return success(res, 200, 'Solicitud eliminada con exito', {
      request: await enrichRequest(request),
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar la solicitud: ' + error.message, {
      request: null,
    })
  }
}

module.exports = {
  approveRequest,
  cancelRequest,
  createRequest,
  destroyRequest,
  getRequestById,
  getRequests,
  updateRequest,
}
