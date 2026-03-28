const { ROLE_NAMES } = require('../../auth/roles')
const { DomainError } = require('../shared/domainError')

const EQUIPMENT_STATUSES = new Set(['active', 'inactive', 'maintenance', 'retired'])
const EQUIPMENT_IDENTITY_FIELDS = ['name', 'type', 'brand', 'model', 'serial', 'code', 'client']

const parseOptionalDate = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError(400, `La fecha enviada para "${fieldName}" no es valida`)
  }

  return parsed
}

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
    throw new DomainError(400, `El equipo requiere ${fieldName}`)
  }
}

const assertValidClientId = (clientId) => {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new DomainError(400, 'El equipo requiere un client valido')
  }
}

const buildEquipmentPayload = (payload) => {
  const nextPayload = { ...payload }

  for (const field of ['name', 'type', 'location', 'brand', 'model', 'serial', 'code', 'alias', 'description', 'status']) {
    if (Object.prototype.hasOwnProperty.call(nextPayload, field)) {
      nextPayload[field] = normalizeOptionalString(nextPayload[field])
    }
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'client')) {
    nextPayload.client = Number(nextPayload.client)
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'use_start_at')) {
    nextPayload.use_start_at = parseOptionalDate(nextPayload.use_start_at, 'use_start_at')
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'use_end_at')) {
    nextPayload.use_end_at = parseOptionalDate(nextPayload.use_end_at, 'use_end_at')
  }

  return nextPayload
}

const assertEquipmentRequiredFields = (payload) => {
  assertRequiredTextField(payload, 'name')
  assertRequiredTextField(payload, 'serial')
  assertRequiredTextField(payload, 'code')
  assertRequiredTextField(payload, 'status')

  assertValidClientId(payload.client)
}

const validateEquipmentPayload = (payload) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'status') && !EQUIPMENT_STATUSES.has(payload.status)) {
    throw new DomainError(400, 'El estado del equipo no es valido')
  }

  if (payload.use_start_at && payload.use_end_at && payload.use_end_at < payload.use_start_at) {
    throw new DomainError(400, 'use_end_at no puede ser menor que use_start_at')
  }
}

const assertEquipmentClientExists = async (Client, clientId) => {
  const client = await Client.findByPk(clientId)

  if (!client) {
    throw new DomainError(400, 'El cliente asociado no existe')
  }
}

const assertEquipmentUpdateAllowed = ({ equipment, payload, roleName }) => {
  if (roleName === ROLE_NAMES.ADMIN_PLATAFORMA || roleName === ROLE_NAMES.ADMIN_CLIENTE) {
    return
  }

  const hasIdentityChanges = EQUIPMENT_IDENTITY_FIELDS.some(
    (field) => Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== equipment[field]
  )

  if (hasIdentityChanges) {
    throw new DomainError(409, 'Solo admin puede cambiar los datos maestros base de un equipo')
  }
}

module.exports = {
  assertEquipmentClientExists,
  assertEquipmentRequiredFields,
  assertEquipmentUpdateAllowed,
  buildEquipmentPayload,
  validateEquipmentPayload,
}
