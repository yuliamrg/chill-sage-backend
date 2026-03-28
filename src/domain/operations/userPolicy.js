const { Op } = require('sequelize')

const { ROLE_IDS } = require('../../auth/roles')
const { DomainError } = require('../shared/domainError')

const USER_STATUSES = new Set(['active', 'inactive'])
const USER_DELETE_RELATION_LABELS = {
  requesterRequests: 'solicitudes creadas',
  reviewedRequests: 'solicitudes revisadas',
  assignedOrders: 'ordenes asignadas',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,50}$/

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

const parseOptionalInteger = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : value
}

const assertRequiredTextField = (payload, fieldName) => {
  if (!payload[fieldName] || typeof payload[fieldName] !== 'string' || !payload[fieldName].trim()) {
    throw new DomainError(400, `El usuario requiere ${fieldName}`)
  }
}

const assertValidPositiveInteger = (value, fieldName) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError(400, `El usuario requiere un ${fieldName} valido`)
  }
}

const buildUserPayload = (payload) => {
  const nextPayload = { ...payload }

  for (const field of ['username', 'name', 'last_name', 'email', 'password', 'status']) {
    if (Object.prototype.hasOwnProperty.call(nextPayload, field)) {
      nextPayload[field] = normalizeOptionalString(nextPayload[field])
    }
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'client')) {
    nextPayload.client = parseOptionalInteger(nextPayload.client)
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'role')) {
    nextPayload.role = parseOptionalInteger(nextPayload.role)
  }

  return nextPayload
}

const assertUserCreateRequiredFields = (payload) => {
  assertRequiredTextField(payload, 'username')
  assertRequiredTextField(payload, 'email')
  assertRequiredTextField(payload, 'password')
  assertRequiredTextField(payload, 'status')
  assertValidPositiveInteger(payload.role, 'role')
}

const assertUserPersistedRequiredFields = (payload) => {
  assertRequiredTextField(payload, 'username')
  assertRequiredTextField(payload, 'email')
  assertRequiredTextField(payload, 'status')
  assertValidPositiveInteger(payload.role, 'role')
}

const validateUserPayload = (payload) => {
  if (payload.username && !USERNAME_REGEX.test(payload.username)) {
    throw new DomainError(400, 'El username del usuario no es valido')
  }

  if (payload.email && !EMAIL_REGEX.test(payload.email)) {
    throw new DomainError(400, 'El email del usuario no es valido')
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'password') && !payload.password) {
    throw new DomainError(400, 'La contrasena del usuario no puede estar vacia')
  }

  if (payload.password && payload.password.length < 8) {
    throw new DomainError(400, 'La contrasena del usuario debe tener al menos 8 caracteres')
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status') && !USER_STATUSES.has(payload.status)) {
    throw new DomainError(400, 'El estado del usuario no es valido')
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'role')) {
    assertValidPositiveInteger(payload.role, 'role')
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'client') && payload.client !== null) {
    assertValidPositiveInteger(payload.client, 'client')
  }
}

const assertUserRelationsExist = async ({ Client, Role, clientId, roleId }) => {
  const [client, role] = await Promise.all([
    clientId ? Client.findByPk(clientId) : null,
    Role.findByPk(roleId),
  ])

  if (clientId && !client) {
    throw new DomainError(400, 'El cliente asociado no existe')
  }

  if (!role) {
    throw new DomainError(400, 'El rol asociado no existe')
  }
}

const assertUserUniqueFields = async ({ User, username, email, excludeUserId = null }) => {
  const where = {
    [Op.or]: [{ username }, { email }],
  }

  if (excludeUserId) {
    where.id = { [Op.ne]: excludeUserId }
  }

  const existingUser = await User.findOne({ where })

  if (!existingUser) {
    return
  }

  if (existingUser.username === username) {
    throw new DomainError(409, 'El username ya esta en uso')
  }

  if (existingUser.email === email) {
    throw new DomainError(409, 'El email ya esta en uso')
  }
}

const assertUserUpdateAllowed = ({ currentUser, payload, authUserId }) => {
  if (Number(authUserId) !== Number(currentUser.id)) {
    return
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'role') && payload.role !== currentUser.role) {
    throw new DomainError(409, 'No puedes cambiar tu propio rol')
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status') && payload.status !== currentUser.status) {
    throw new DomainError(409, 'No puedes cambiar tu propio estado')
  }
}

const assertUserDeleteAllowed = ({ targetUserId, authUserId, relationCounts }) => {
  if (Number(targetUserId) === Number(authUserId)) {
    throw new DomainError(409, 'No puedes eliminar tu propio usuario')
  }

  const activeRelations = Object.entries(relationCounts).filter(([, count]) => count > 0)

  if (!activeRelations.length) {
    return
  }

  const relationSummary = activeRelations
    .map(([key, count]) => `${count} ${USER_DELETE_RELATION_LABELS[key] || key}`)
    .join(', ')

  throw new DomainError(409, `No se puede eliminar el usuario porque tiene recursos asociados: ${relationSummary}`)
}

const resolveCreateDefaults = (payload) => ({
  ...payload,
  status: payload.status || 'active',
  role: payload.role || ROLE_IDS.SOLICITANTE,
})

module.exports = {
  assertUserCreateRequiredFields,
  assertUserDeleteAllowed,
  assertUserPersistedRequiredFields,
  assertUserRelationsExist,
  assertUserUniqueFields,
  assertUserUpdateAllowed,
  buildUserPayload,
  resolveCreateDefaults,
  validateUserPayload,
}
