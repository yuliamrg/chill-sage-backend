const { ROLE_NAMES } = require('../../auth/roles')
const { DomainError } = require('../shared/domainError')

const ORDER_STATUSES = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

const ORDER_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  ASSIGN: 'assign',
  START: 'start',
  COMPLETE: 'complete',
  CANCEL: 'cancel',
}

const ACTIVE_ORDER_STATUSES = [ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.IN_PROGRESS]
const ORDER_CREATE_FORBIDDEN_FIELDS = ['status', 'started_at', 'finished_at', 'work_description', 'worked_hours', 'cancel_reason']
const ORDER_MUTATION_FORBIDDEN_FIELDS = [
  'status',
  'started_at',
  'finished_at',
  'work_description',
  'worked_hours',
  'cancel_reason',
  'request_id',
  'client_id',
  'equipment_id',
  'type',
]

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

const assertNoManualOrderCreateTransitionFields = (payload, actionLabel) => {
  const attemptedFields = ORDER_CREATE_FORBIDDEN_FIELDS.filter((field) => hasOwn(payload, field))

  if (attemptedFields.length) {
    throw new DomainError(409, `Los cambios de estado de la orden deben usar endpoints de accion, no ${actionLabel}`)
  }
}

const assertNoManualOrderTransitionFields = (payload, actionLabel) => {
  const attemptedFields = ORDER_MUTATION_FORBIDDEN_FIELDS.filter((field) => hasOwn(payload, field))

  if (attemptedFields.length) {
    throw new DomainError(409, `Los cambios de estado de la orden deben usar endpoints de accion, no ${actionLabel}`)
  }
}

const validateOrderTimes = ({ started_at, finished_at }) => {
  if (started_at && finished_at && finished_at < started_at) {
    throw new DomainError(400, 'finished_at no puede ser anterior a started_at')
  }
}

const assertOrderCreateAllowed = ({ request, activeOrderExists }) => {
  if (!request) {
    throw new DomainError(400, 'La solicitud origen no existe')
  }

  if (request.status !== 'approved') {
    throw new DomainError(409, 'La orden solo puede crearse desde una solicitud aprobada')
  }

  if (activeOrderExists) {
    throw new DomainError(409, 'La solicitud ya tiene una orden activa')
  }
}

const buildCreateOrderPayload = ({ request, payload }) => ({
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
})

const assertOrderUpdateAllowed = ({ order, payload }) => {
  assertNoManualOrderTransitionFields(payload, 'PUT')

  if (order.status === ORDER_STATUSES.COMPLETED || order.status === ORDER_STATUSES.CANCELLED) {
    throw new DomainError(409, 'No se puede editar una orden completada o cancelada')
  }
}

const assertOrderActionAllowed = ({ action, order, auth }) => {
  if (action === ORDER_ACTIONS.ASSIGN) {
    if (order.status === ORDER_STATUSES.COMPLETED || order.status === ORDER_STATUSES.CANCELLED) {
      throw new DomainError(409, 'No se puede asignar una orden completada o cancelada')
    }

    return
  }

  if (action === ORDER_ACTIONS.START) {
    if (order.status !== ORDER_STATUSES.ASSIGNED) {
      throw new DomainError(409, 'Solo se pueden iniciar ordenes asignadas')
    }

    if (!order.assigned_user_id) {
      throw new DomainError(409, 'La orden debe tener un tecnico asignado antes de iniciar')
    }

    if (auth.roleName === ROLE_NAMES.TECNICO && order.assigned_user_id !== auth.userId) {
      throw new DomainError(403, 'Solo el tecnico asignado puede iniciar esta orden')
    }

    return
  }

  if (action === ORDER_ACTIONS.COMPLETE) {
    if (order.status !== ORDER_STATUSES.IN_PROGRESS) {
      throw new DomainError(409, 'Solo se pueden completar ordenes en ejecucion')
    }

    if (!order.assigned_user_id) {
      throw new DomainError(409, 'La orden debe tener un tecnico asignado')
    }

    if (!order.started_at) {
      throw new DomainError(409, 'La orden debe tener started_at antes de completarse')
    }

    if (auth.roleName === ROLE_NAMES.TECNICO && order.assigned_user_id !== auth.userId) {
      throw new DomainError(403, 'Solo el tecnico asignado puede completar esta orden')
    }

    return
  }

  if (action === ORDER_ACTIONS.CANCEL) {
    if (order.status === ORDER_STATUSES.COMPLETED) {
      throw new DomainError(409, 'No se puede cancelar una orden completada')
    }

    if (order.status === ORDER_STATUSES.CANCELLED) {
      throw new DomainError(409, 'La orden ya esta cancelada')
    }
  }
}

const buildAssignOrderPayload = ({ payload, order }) => {
  if (!payload.assigned_user_id) {
    throw new DomainError(400, 'La asignacion requiere assigned_user_id')
  }

  return {
    assigned_user_id: payload.assigned_user_id,
    planned_start_at: payload.planned_start_at || order.planned_start_at,
    status: ORDER_STATUSES.ASSIGNED,
  }
}

const buildStartOrderPayload = ({ startedAt }) => ({
  status: ORDER_STATUSES.IN_PROGRESS,
  started_at: startedAt || new Date(),
})

const buildCompleteOrderPayload = ({ body, order }) => {
  const completionPayload = {
    finished_at: body.finished_at ? new Date(body.finished_at) : new Date(),
    worked_hours: body.worked_hours,
    work_description: body.work_description?.trim(),
    closure_notes: body.closure_notes ?? order.closure_notes,
    diagnosis: body.diagnosis ?? order.diagnosis,
    received_satisfaction: body.received_satisfaction ?? order.received_satisfaction,
    status: ORDER_STATUSES.COMPLETED,
  }

  if (!completionPayload.work_description) {
    throw new DomainError(400, 'El cierre requiere work_description')
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

  return {
    finished_at: completionPayload.finished_at,
    worked_hours: Number(completionPayload.worked_hours),
    work_description: completionPayload.work_description,
    closure_notes: completionPayload.closure_notes,
    diagnosis: completionPayload.diagnosis,
    received_satisfaction: completionPayload.received_satisfaction,
    status: completionPayload.status,
  }
}

const buildCancelOrderPayload = ({ body }) => {
  if (!body.cancel_reason?.trim()) {
    throw new DomainError(400, 'La cancelacion requiere cancel_reason')
  }

  return {
    status: ORDER_STATUSES.CANCELLED,
    cancel_reason: body.cancel_reason.trim(),
  }
}

module.exports = {
  ACTIVE_ORDER_STATUSES,
  ORDER_ACTIONS,
  ORDER_STATUSES,
  assertNoManualOrderCreateTransitionFields,
  assertNoManualOrderTransitionFields,
  assertOrderActionAllowed,
  assertOrderCreateAllowed,
  assertOrderUpdateAllowed,
  buildAssignOrderPayload,
  buildCancelOrderPayload,
  buildCompleteOrderPayload,
  buildCreateOrderPayload,
  buildStartOrderPayload,
  validateOrderTimes,
}
