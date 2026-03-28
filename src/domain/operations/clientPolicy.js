const { ROLE_NAMES } = require('../../auth/roles')
const { DomainError } = require('../shared/domainError')

const CLIENT_STATUSES = new Set(['active', 'inactive'])
const CLIENT_IDENTITY_FIELDS = ['name', 'email']
const CLIENT_DELETE_RELATION_LABELS = {
  users: 'usuarios',
  equipments: 'equipos',
  requests: 'solicitudes',
  orders: 'ordenes',
  schedules: 'cronogramas',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[0-9+()\-\s]+$/

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed || null
}

const assertRequiredTextField = (payload, fieldName) => {
  if (!payload[fieldName] || typeof payload[fieldName] !== 'string' || !payload[fieldName].trim()) {
    throw new DomainError(400, `El cliente requiere ${fieldName}`)
  }
}

const buildClientPayload = (payload) => {
  const nextPayload = { ...payload }

  for (const field of ['name', 'address', 'phone', 'email', 'description', 'status']) {
    if (Object.prototype.hasOwnProperty.call(nextPayload, field)) {
      nextPayload[field] = normalizeOptionalString(nextPayload[field])
    }
  }

  return nextPayload
}

const assertClientRequiredFields = (payload) => {
  assertRequiredTextField(payload, 'name')
  assertRequiredTextField(payload, 'email')
  assertRequiredTextField(payload, 'status')
}

const validateClientPayload = (payload) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'status') && !CLIENT_STATUSES.has(payload.status)) {
    throw new DomainError(400, 'El estado del cliente no es valido')
  }

  if (payload.email && !EMAIL_REGEX.test(payload.email)) {
    throw new DomainError(400, 'El email del cliente no es valido')
  }

  if (payload.phone) {
    const digits = payload.phone.replace(/\D/g, '')

    if (!PHONE_REGEX.test(payload.phone) || digits.length < 7) {
      throw new DomainError(400, 'El telefono del cliente no es valido')
    }
  }
}

const assertClientUpdateAllowed = ({ client, payload, roleName }) => {
  if (roleName === ROLE_NAMES.ADMIN) {
    return
  }

  const hasIdentityChanges = CLIENT_IDENTITY_FIELDS.some(
    (field) => Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== client[field]
  )

  if (hasIdentityChanges) {
    throw new DomainError(409, 'Solo admin puede cambiar los datos maestros base de un cliente')
  }
}

const assertClientDeleteAllowed = (relationCounts) => {
  const activeRelations = Object.entries(relationCounts).filter(([, count]) => count > 0)

  if (!activeRelations.length) {
    return
  }

  const relationSummary = activeRelations
    .map(([key, count]) => `${count} ${CLIENT_DELETE_RELATION_LABELS[key] || key}`)
    .join(', ')

  throw new DomainError(409, `No se puede eliminar el cliente porque tiene recursos asociados: ${relationSummary}`)
}

module.exports = {
  assertClientDeleteAllowed,
  assertClientRequiredFields,
  assertClientUpdateAllowed,
  buildClientPayload,
  validateClientPayload,
}
