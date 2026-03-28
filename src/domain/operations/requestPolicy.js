const { ROLE_NAMES } = require('../../auth/roles')
const { DomainError } = require('../shared/domainError')

const REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
}

const REQUEST_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  APPROVE: 'approve',
  CANCEL: 'cancel',
}

const REQUEST_TYPES = new Set(['corrective', 'preventive', 'inspection', 'installation'])
const REQUEST_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])
const REQUEST_IDENTITY_FIELDS = ['client_id', 'requester_user_id', 'equipment_id', 'type']
const REQUEST_STATE_CONTROL_FIELDS = ['status', 'reviewed_at', 'reviewed_by_user_id', 'review_notes', 'cancel_reason']

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

const assertNoManualRequestStateFields = (payload, actionLabel) => {
  const attemptedFields = REQUEST_STATE_CONTROL_FIELDS.filter((field) => hasOwn(payload, field))

  if (attemptedFields.length) {
    throw new DomainError(409, `Los cambios de estado de la solicitud deben usar endpoints de accion, no ${actionLabel}`)
  }
}

const validateRequestTypeAndPriority = (payload) => {
  if (payload.type && !REQUEST_TYPES.has(payload.type)) {
    throw new DomainError(400, 'El tipo de solicitud no es valido')
  }

  if (payload.priority && !REQUEST_PRIORITIES.has(payload.priority)) {
    throw new DomainError(400, 'La prioridad de la solicitud no es valida')
  }
}

const assertRequestRequiredFields = (payload) => {
  if (!payload.client_id) {
    throw new DomainError(400, 'La solicitud requiere client_id')
  }

  if (!payload.requester_user_id) {
    throw new DomainError(400, 'La solicitud requiere requester_user_id')
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
}

const buildCreateRequestPayload = (payload) => ({
  ...payload,
  type: payload.type || 'corrective',
  priority: payload.priority || 'medium',
  status: REQUEST_STATUSES.PENDING,
  requested_at: new Date(),
})

const assertRequestActionAllowed = ({ action, request, relatedOrder }) => {
  if (action === REQUEST_ACTIONS.APPROVE && request.status !== REQUEST_STATUSES.PENDING) {
    throw new DomainError(409, 'Solo se pueden aprobar solicitudes pendientes')
  }

  if (action === REQUEST_ACTIONS.CANCEL) {
    if (request.status !== REQUEST_STATUSES.PENDING) {
      throw new DomainError(409, 'Solo se pueden anular solicitudes pendientes')
    }

    if (relatedOrder) {
      throw new DomainError(409, 'La solicitud ya genero una orden y no puede anularse')
    }
  }
}

const assertRequestUpdateAllowed = ({ request, payload, roleName }) => {
  assertNoManualRequestStateFields(payload, 'PUT')

  if (request.status !== REQUEST_STATUSES.PENDING) {
    throw new DomainError(409, 'Las solicitudes aprobadas o anuladas no se pueden editar')
  }

  if (roleName === ROLE_NAMES.ADMIN_PLATAFORMA || roleName === ROLE_NAMES.ADMIN_CLIENTE) {
    return
  }

  const hasIdentityChanges = REQUEST_IDENTITY_FIELDS.some(
    (field) => hasOwn(payload, field) && payload[field] !== request[field]
  )

  if (hasIdentityChanges) {
    throw new DomainError(409, 'Solo admin puede cambiar los datos operativos base de una solicitud')
  }
}

const buildRequestActionUpdate = ({ action, actorUserId, body }) => {
  if (action === REQUEST_ACTIONS.APPROVE) {
    return {
      status: REQUEST_STATUSES.APPROVED,
      reviewed_at: new Date(),
      reviewed_by_user_id: actorUserId,
      review_notes: body.review_notes || null,
      cancel_reason: null,
    }
  }

  if (action === REQUEST_ACTIONS.CANCEL) {
    if (!body.cancel_reason?.trim()) {
      throw new DomainError(400, 'La anulacion requiere cancel_reason')
    }

    return {
      status: REQUEST_STATUSES.CANCELLED,
      reviewed_at: new Date(),
      reviewed_by_user_id: actorUserId,
      review_notes: body.review_notes || null,
      cancel_reason: body.cancel_reason.trim(),
    }
  }

  throw new DomainError(500, 'Accion de solicitud no soportada')
}

module.exports = {
  REQUEST_ACTIONS,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  assertNoManualRequestStateFields,
  assertRequestActionAllowed,
  assertRequestRequiredFields,
  assertRequestUpdateAllowed,
  buildCreateRequestPayload,
  buildRequestActionUpdate,
  validateRequestTypeAndPriority,
}
