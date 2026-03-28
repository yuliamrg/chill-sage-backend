const { Op } = require('sequelize')

const { ROLE_NAMES } = require('../../auth/roles')
const {
  REQUEST_ACTIONS,
  assertNoManualRequestStateFields,
  assertRequestActionAllowed,
  assertRequestRequiredFields,
  assertRequestUpdateAllowed,
  buildCreateRequestPayload,
  buildRequestActionUpdate,
  validateRequestTypeAndPriority,
} = require('../../domain/operations/requestPolicy')
const { DomainError, buildDomainErrorResponse } = require('../../domain/shared/domainError')
const { Client, Equipment, Order, Request, User } = require('../../models')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const REQUEST_CREATE_FIELDS = ['client_id', 'requester_user_id', 'equipment_id', 'type', 'title', 'description', 'priority']
const REQUEST_UPDATE_FIELDS = ['client_id', 'requester_user_id', 'equipment_id', 'type', 'title', 'description', 'priority']

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

  assertNoManualRequestStateFields(req.body, 'POST')

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

  const nextPayload = buildCreateRequestPayload(payload)

  assertRequestRequiredFields(nextPayload)
  validateRequestTypeAndPriority(nextPayload)

  const client = await Client.findByPk(nextPayload.client_id)

  if (!client) {
    throw new DomainError(400, 'El cliente asociado no existe')
  }

  await getEquipmentForClient(nextPayload.equipment_id, nextPayload.client_id)

  return nextPayload
}

const resolveUpdatePayload = async (req, existingRequest) => {
  const payload = pickAllowedFields(req.body, REQUEST_UPDATE_FIELDS)
  assertRequestUpdateAllowed({
    request: existingRequest,
    payload: req.body,
    roleName: req.auth.roleName,
  })

  const nextPayload = {
    ...existingRequest.toJSON(),
    ...payload,
  }

  assertRequestRequiredFields(nextPayload)
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
    const pagination = parsePaginationQuery(req.query, {
      allowedSortFields: ['id', 'requested_at', 'status', 'priority', 'type', 'created_at', 'updated_at'],
      defaultSort: { field: 'requested_at', direction: 'DESC' },
    })
    const { count, rows } = await Request.findAndCountAll({
      where: await buildRequestWhere(req),
      limit: pagination.limit,
      offset: pagination.offset,
      order: pagination.order,
    })
    const hydratedRequests = await Promise.all(rows.map(enrichRequest))

    return success(res, 200, 'Obteniendo solicitudes', {
      requests: hydratedRequests,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        sort: pagination.sort,
        returned: hydratedRequests.length,
      }),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'requests')
    }

    if (error instanceof PaginationQueryError) {
      return failure(res, 400, error.message, { requests: [], meta: null })
    }

    return failure(res, 500, 'No fue posible obtener solicitudes', {
      requests: [],
      meta: null,
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

    return failure(res, 500, 'No fue posible obtener la solicitud', {
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
    assertRequestActionAllowed({
      action: REQUEST_ACTIONS.APPROVE,
      request,
    })

    await request.update(
      withUpdateAudit(
        buildRequestActionUpdate({
          action: REQUEST_ACTIONS.APPROVE,
          actorUserId: req.auth.userId,
          body: req.body,
        }),
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
    const relatedOrder = await Order.findOne({ where: { request_id: request.id } })
    assertRequestActionAllowed({
      action: REQUEST_ACTIONS.CANCEL,
      request,
      relatedOrder,
    })

    await request.update(
      withUpdateAudit(
        buildRequestActionUpdate({
          action: REQUEST_ACTIONS.CANCEL,
          actorUserId: req.auth.userId,
          body: req.body,
        }),
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
    return failure(res, 500, 'No fue posible eliminar la solicitud', {
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
