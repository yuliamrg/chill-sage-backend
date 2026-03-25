const { DomainError } = require('../shared/domainError')

const SCHEDULE_STATUSES = {
  UNASSIGNED: 'unassigned',
  OPEN: 'open',
  CLOSED: 'closed',
}

const SCHEDULE_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  OPEN: 'open',
  CLOSE: 'close',
}

const SCHEDULE_MUTATION_FORBIDDEN_FIELDS = ['status']

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

const assertNoManualScheduleStateFields = (payload, actionLabel) => {
  const attemptedFields = SCHEDULE_MUTATION_FORBIDDEN_FIELDS.filter((field) => hasOwn(payload, field))

  if (attemptedFields.length) {
    throw new DomainError(409, `Los cambios de estado del cronograma deben usar endpoints de accion, no ${actionLabel}`)
  }
}

const assertScheduleRequiredFields = (payload) => {
  if (!payload.client_id) {
    throw new DomainError(400, 'El cronograma requiere client_id')
  }

  if (!payload.name?.trim()) {
    throw new DomainError(400, 'El cronograma requiere name')
  }

  if (!payload.type?.trim()) {
    throw new DomainError(400, 'El cronograma requiere type')
  }

  if (!payload.scheduled_date) {
    throw new DomainError(400, 'El cronograma requiere scheduled_date')
  }
}

const assertScheduleUpdateAllowed = ({ schedule, payload }) => {
  assertNoManualScheduleStateFields(payload, 'PUT')

  if (schedule.status === SCHEDULE_STATUSES.CLOSED) {
    throw new DomainError(409, 'No se puede editar un cronograma cerrado')
  }
}

const assertScheduleActionAllowed = ({ action, schedule }) => {
  if (action === SCHEDULE_ACTIONS.OPEN) {
    if (schedule.status === SCHEDULE_STATUSES.OPEN) {
      throw new DomainError(409, 'El cronograma ya esta abierto')
    }

    if (schedule.status === SCHEDULE_STATUSES.CLOSED) {
      throw new DomainError(409, 'No se puede reabrir un cronograma cerrado')
    }

    return
  }

  if (action === SCHEDULE_ACTIONS.CLOSE) {
    if (schedule.status === SCHEDULE_STATUSES.CLOSED) {
      throw new DomainError(409, 'El cronograma ya esta cerrado')
    }

    if (schedule.status !== SCHEDULE_STATUSES.OPEN) {
      throw new DomainError(409, 'Solo se pueden cerrar cronogramas abiertos')
    }
  }
}

module.exports = {
  SCHEDULE_ACTIONS,
  SCHEDULE_STATUSES,
  assertNoManualScheduleStateFields,
  assertScheduleActionAllowed,
  assertScheduleRequiredFields,
  assertScheduleUpdateAllowed,
}
