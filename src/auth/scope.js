const { Op } = require('sequelize')

const Client = require('../models/Clients/Client.model')
const UserClientScope = require('../models/Users/UserClientScope.model')
const { DomainError } = require('../domain/shared/domainError')
const { isClientScopedRole, isPlatformAdminRole } = require('./roles')

const toUniqueSortedIntegerList = (values = []) =>
  [...new Set(values.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => a - b)

const parseBooleanFlag = (value) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') {
      return true
    }

    if (normalized === 'false') {
      return false
    }
  }

  return Boolean(value)
}

const normalizeClientScopePayload = (payload) => {
  const nextPayload = { ...payload }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'primary_client_id')) {
    nextPayload.primary_client_id = nextPayload.primary_client_id === null || nextPayload.primary_client_id === ''
      ? null
      : Number(nextPayload.primary_client_id)
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'client_ids')) {
    const input = Array.isArray(nextPayload.client_ids)
      ? nextPayload.client_ids
      : nextPayload.client_ids === null || nextPayload.client_ids === undefined || nextPayload.client_ids === ''
        ? []
        : [nextPayload.client_ids]

    nextPayload.client_ids = toUniqueSortedIntegerList(input)
  }

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'all_clients')) {
    nextPayload.all_clients = parseBooleanFlag(nextPayload.all_clients)
  }

  return nextPayload
}

const listScopedClientIds = async (userId, options = {}) => {
  const scopes = await UserClientScope.findAll({
    where: { user_id: userId },
    attributes: ['client_id'],
    order: [['client_id', 'ASC']],
    ...options,
  })

  return scopes.map((scope) => scope.client_id)
}

const loadUserAccessContext = async (user) => {
  const roleName = user?.roleRecord?.description

  if (!user) {
    return null
  }

  const clientIds = isPlatformAdminRole(roleName) ? [] : await listScopedClientIds(user.id)

  return {
    userId: user.id,
    roleId: user.role,
    roleName,
    primaryClientId: user.client ?? null,
    allClients: Boolean(user.all_clients),
    clientIds,
  }
}

const hasClientAccess = (auth, clientId) => {
  const normalizedClientId = Number(clientId)

  if (!Number.isInteger(normalizedClientId) || normalizedClientId <= 0) {
    return false
  }

  if (isPlatformAdminRole(auth?.roleName)) {
    return true
  }

  if (!isClientScopedRole(auth?.roleName)) {
    return false
  }

  if (auth?.allClients) {
    return true
  }

  return Array.isArray(auth?.clientIds) && auth.clientIds.includes(normalizedClientId)
}

const assertClientAccess = (auth, clientId, message = 'No tienes permisos para operar sobre ese cliente') => {
  if (!hasClientAccess(auth, clientId)) {
    throw new DomainError(403, message)
  }
}

const buildScopedClientWhere = (auth, fieldName = 'client_id') => {
  if (isPlatformAdminRole(auth?.roleName)) {
    return {}
  }

  if (!isClientScopedRole(auth?.roleName)) {
    return { [fieldName]: -1 }
  }

  if (auth?.allClients) {
    return {}
  }

  if (!auth?.clientIds?.length) {
    return { [fieldName]: -1 }
  }

  return {
    [fieldName]: {
      [Op.in]: auth.clientIds,
    },
  }
}

const isScopeSubsetOfActor = (auth, { clientIds = [], allClients = false }) => {
  if (isPlatformAdminRole(auth?.roleName)) {
    return true
  }

  if (allClients) {
    return Boolean(auth?.allClients)
  }

  return toUniqueSortedIntegerList(clientIds).every((clientId) => hasClientAccess(auth, clientId))
}

const assertAccessibleClientFilter = (auth, clientId) => {
  if (clientId === undefined || clientId === null || clientId === '') {
    return
  }

  const normalizedClientId = Number(clientId)

  if (!Number.isInteger(normalizedClientId) || normalizedClientId <= 0) {
    throw new DomainError(400, 'El filtro client_id no es valido')
  }

  if (!hasClientAccess(auth, normalizedClientId)) {
    throw new DomainError(403, 'No tienes permisos para filtrar por ese cliente')
  }
}

const resolvePrimaryClientIdForAction = (auth, payloadClientId) => {
  if (payloadClientId !== undefined && payloadClientId !== null && payloadClientId !== '') {
    const normalizedClientId = Number(payloadClientId)

    if (!Number.isInteger(normalizedClientId) || normalizedClientId <= 0) {
      throw new DomainError(400, 'El client_id enviado no es valido')
    }

    assertClientAccess(auth, normalizedClientId)
    return normalizedClientId
  }

  if (auth?.primaryClientId) {
    assertClientAccess(auth, auth.primaryClientId)
    return auth.primaryClientId
  }

  throw new DomainError(400, 'La operacion requiere client_id porque el usuario no tiene un cliente primario valido')
}

const assertClientScopePayloadAllowed = ({ auth, payloadClientIds = [], allClients = false }) => {
  const normalizedClientIds = toUniqueSortedIntegerList(payloadClientIds)

  if (isPlatformAdminRole(auth?.roleName)) {
    return normalizedClientIds
  }

  if (allClients && !auth?.allClients) {
    throw new DomainError(403, 'No puedes asignar acceso total a clientes fuera de tu cobertura')
  }

  const unauthorizedClientId = normalizedClientIds.find((clientId) => !hasClientAccess(auth, clientId))

  if (unauthorizedClientId) {
    throw new DomainError(403, 'No puedes asignar clientes fuera de tu cobertura')
  }

  return normalizedClientIds
}

const assertClientsExist = async (clientIds = []) => {
  const normalizedClientIds = toUniqueSortedIntegerList(clientIds)

  if (!normalizedClientIds.length) {
    return
  }

  const count = await Client.count({
    where: {
      id: {
        [Op.in]: normalizedClientIds,
      },
    },
  })

  if (count !== normalizedClientIds.length) {
    throw new DomainError(400, 'Uno o mas clientes asociados no existen')
  }
}

const replaceUserClientScopes = async ({ userId, clientIds, transaction = null }) => {
  const normalizedClientIds = toUniqueSortedIntegerList(clientIds)
  const scopeOptions = transaction ? { transaction } : {}

  await UserClientScope.destroy({
    where: { user_id: userId },
    ...scopeOptions,
  })

  if (!normalizedClientIds.length) {
    return
  }

  await UserClientScope.bulkCreate(
    normalizedClientIds.map((clientId) => ({
      user_id: userId,
      client_id: clientId,
    })),
    scopeOptions
  )
}

const enrichUserWithScope = async (userData) => {
  if (!userData) {
    return null
  }

  const normalizedUserData = typeof userData.toJSON === 'function' ? userData.toJSON() : userData
  const clientIds = await listScopedClientIds(normalizedUserData.id)
  const clients = clientIds.length
    ? await Client.findAll({
        where: {
          id: {
            [Op.in]: clientIds,
          },
        },
        attributes: ['id', 'name', 'status'],
        order: [['id', 'ASC']],
      })
    : []

  return {
    ...normalizedUserData,
    primary_client_id: normalizedUserData.client ?? null,
    primary_client_name: clients.find((client) => client.id === normalizedUserData.client)?.name ?? null,
    client_ids: clientIds,
    all_clients: Boolean(normalizedUserData.all_clients),
    clients: clients.map((client) => ({
      id: client.id,
      name: client.name,
      status: client.status,
    })),
  }
}

module.exports = {
  assertAccessibleClientFilter,
  assertClientAccess,
  assertClientScopePayloadAllowed,
  assertClientsExist,
  buildScopedClientWhere,
  enrichUserWithScope,
  hasClientAccess,
  isScopeSubsetOfActor,
  listScopedClientIds,
  loadUserAccessContext,
  normalizeClientScopePayload,
  parseBooleanFlag,
  replaceUserClientScopes,
  resolvePrimaryClientIdForAction,
  toUniqueSortedIntegerList,
}
