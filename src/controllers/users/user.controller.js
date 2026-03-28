const { Op } = require('sequelize')
const bcrypt = require('bcrypt')

const User = require('../../models/Users/User.model')
const Client = require('../../models/Clients/Client.model')
const Role = require('../../models/Roles/Role.model')
const Order = require('../../models/Orders/Order.model')
const Request = require('../../models/Requests/request.model')
const {
  ROLE_NAMES,
  isPlatformAdminRole,
} = require('../../auth/roles')
const {
  assertClientAccess,
  assertClientScopePayloadAllowed,
  enrichUserWithScope,
  isScopeSubsetOfActor,
  listScopedClientIds,
  normalizeClientScopePayload,
  replaceUserClientScopes,
} = require('../../auth/scope')
const {
  assertUserCreateRequiredFields,
  assertUserDeleteAllowed,
  assertUserPersistedRequiredFields,
  assertUserRelationsExist,
  assertUserScopeShape,
  assertUserUniqueFields,
  assertUserUpdateAllowed,
  buildUserPayload,
  resolveCreateDefaults,
  validateUserPayload,
} = require('../../domain/operations/userPolicy')
const { DomainError, buildDomainErrorResponse } = require('../../domain/shared/domainError')
const { signAccessToken, getJwtExpiresIn } = require('../../auth/jwt')
const { buildRequestLogContext, logInfo, logWarn } = require('../../observability/logger')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')
const { handleRequestError, logRequestError } = require('../../utils/requestError')

const USER_CREATE_FIELDS = ['username', 'name', 'last_name', 'email', 'password', 'primary_client_id', 'client_ids', 'all_clients', 'role', 'status']
const USER_UPDATE_FIELDS = ['username', 'name', 'last_name', 'email', 'password', 'primary_client_id', 'client_ids', 'all_clients', 'role', 'status']

const CLIENT_MANAGEABLE_ROLE_NAMES = [
  ROLE_NAMES.ADMIN_CLIENTE,
  ROLE_NAMES.SOLICITANTE,
  ROLE_NAMES.PLANEADOR,
  ROLE_NAMES.TECNICO,
]

const sanitizeUser = (user) => {
  if (!user) {
    return null
  }

  const userData = typeof user.toJSON === 'function' ? user.toJSON() : user
  const { password, client, ...safeUser } = userData
  return safeUser
}

const enrichUser = async (user) => {
  const safeUser = sanitizeUser(user)

  if (!safeUser) {
    return null
  }

  const [primaryClient, role, scopedUser] = await Promise.all([
    user.client ? Client.findByPk(user.client) : null,
    user.role ? Role.findByPk(user.role) : null,
    enrichUserWithScope({
      ...safeUser,
      client: user.client ?? null,
      all_clients: user.all_clients,
    }),
  ])

  const { client, ...userWithScope } = scopedUser

  return {
    ...userWithScope,
    role_name: role?.description ?? null,
    primary_client_name: primaryClient?.name ?? null,
  }
}

const assertRoleGrantAllowed = ({ auth, targetRoleName }) => {
  if (isPlatformAdminRole(auth?.roleName)) {
    return
  }

  if (auth?.roleName !== ROLE_NAMES.ADMIN_CLIENTE) {
    throw new DomainError(403, 'No tienes permisos para asignar ese rol')
  }

  if (!CLIENT_MANAGEABLE_ROLE_NAMES.includes(targetRoleName)) {
    throw new DomainError(403, 'No puedes asignar ese rol')
  }
}

const canReadScopedUser = async (auth, user) => {
  if (isPlatformAdminRole(auth?.roleName)) {
    return true
  }

  if (!user || user.roleRecord?.description === ROLE_NAMES.ADMIN_PLATAFORMA) {
    return false
  }

  const clientIds = await listScopedClientIds(user.id)

  return isScopeSubsetOfActor(auth, {
    clientIds,
    allClients: Boolean(user.all_clients),
  })
}

const assertScopedUserManagementAllowed = async ({ auth, user }) => {
  if (isPlatformAdminRole(auth?.roleName)) {
    return
  }

  if (auth?.roleName !== ROLE_NAMES.ADMIN_CLIENTE) {
    throw new DomainError(403, 'No tienes permisos para administrar usuarios')
  }

  if (user.roleRecord?.description === ROLE_NAMES.ADMIN_PLATAFORMA) {
    throw new DomainError(404, 'Usuario no encontrado')
  }

  const clientIds = await listScopedClientIds(user.id)

  if (!isScopeSubsetOfActor(auth, { clientIds, allClients: Boolean(user.all_clients) })) {
    throw new DomainError(404, 'Usuario no encontrado')
  }
}

const buildUserWritePayload = (payload) => ({
  ...payload,
  client: payload.primary_client_id ?? null,
})

const resolveTargetScope = ({ payload, fallback }) => ({
  primaryClientId: Object.prototype.hasOwnProperty.call(payload, 'primary_client_id')
    ? payload.primary_client_id
    : fallback.primaryClientId,
  clientIds: Object.prototype.hasOwnProperty.call(payload, 'client_ids')
    ? payload.client_ids
    : fallback.clientIds,
  allClients: Object.prototype.hasOwnProperty.call(payload, 'all_clients')
    ? payload.all_clients
    : fallback.allClients,
})

const getVisibleUsers = async (auth) => {
  const users = await User.findAll({
    include: [{ model: Role, as: 'roleRecord', attributes: ['id', 'description'] }],
    order: [['created_at', 'DESC'], ['id', 'DESC']],
  })

  const visibleUsers = []

  for (const user of users) {
    if (await canReadScopedUser(auth, user)) {
      visibleUsers.push(user)
    }
  }

  return visibleUsers
}

const login = async (req, res) => {
  try {
    const { email, username, password } = req.body
    const loginCandidates = []

    if (email) {
      loginCandidates.push({ email })
    }

    if (username) {
      loginCandidates.push({ username })
    }

    if (!password || loginCandidates.length === 0) {
      logWarn('auth.login.invalid-payload', buildRequestLogContext(req))
      return failure(res, 400, 'Debes enviar email o username junto con la contrasena', { user: null })
    }

    const user = await User.findOne({
      where: {
        [Op.or]: loginCandidates,
      },
      include: [{ model: Role, as: 'roleRecord', attributes: ['id', 'description'] }],
    })

    if (!user) {
      logWarn('auth.login.user-not-found', {
        ...buildRequestLogContext(req),
        email: email || undefined,
        username: username || undefined,
      })
      return failure(res, 401, 'Usuario no encontrado', { user: null })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      logWarn('auth.login.invalid-password', {
        ...buildRequestLogContext(req),
        authUserId: user.id,
      })
      return failure(res, 401, 'Contrasena incorrecta', { user: null })
    }

    if (user.status !== 'active') {
      logWarn('auth.login.inactive-user', {
        ...buildRequestLogContext(req),
        authUserId: user.id,
      })
      return failure(res, 401, 'Usuario inactivo', { user: null })
    }

    const enrichedUser = await enrichUser(user)
    const accessToken = signAccessToken({
      userId: user.id,
      roleId: user.role,
      roleName: user.roleRecord.description,
    })

    logInfo('auth.login.success', {
      ...buildRequestLogContext(req),
      authUserId: user.id,
      roleId: user.role,
    })

    return success(res, 200, 'Inicio de sesion exitoso', {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: getJwtExpiresIn(),
      user: enrichedUser,
    })
  } catch (error) {
    logRequestError('users.login', req, error)
    return failure(res, 500, 'No fue posible iniciar sesion', {
      user: null,
    })
  }
}

const getUsers = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query, {
      allowedSortFields: ['id', 'username', 'email', 'status', 'created_at', 'updated_at'],
      defaultSort: { field: 'created_at', direction: 'DESC' },
    })
    const visibleUsers = await getVisibleUsers(req.auth)
    const pagedUsers = visibleUsers.slice(pagination.offset, pagination.offset + pagination.limit)
    const hydratedUsers = await Promise.all(pagedUsers.map(enrichUser))

    return success(res, 200, 'Obteniendo usuarios', {
      users: hydratedUsers,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: visibleUsers.length,
        sort: pagination.sort,
        returned: hydratedUsers.length,
      }),
    })
  } catch (error) {
    if (error instanceof PaginationQueryError) {
      return failure(res, 400, error.message, { users: [], meta: null })
    }

    return failure(res, 500, 'No fue posible obtener usuarios', {
      users: [],
      meta: null,
    })
  }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'roleRecord', attributes: ['id', 'description'] }],
    })

    if (!user || !(await canReadScopedUser(req.auth, user))) {
      return failure(res, 404, 'Usuario no encontrado', { user: null })
    }

    return success(res, 200, 'Usuario encontrado', {
      user: await enrichUser(user),
    })
  } catch (error) {
    return failure(res, 500, 'No fue posible obtener el usuario', {
      user: null,
    })
  }
}

const createUser = async (req, res) => {
  try {
    const rawPayload = pickAllowedFields(req.body, USER_CREATE_FIELDS)
    const payload = resolveCreateDefaults(normalizeClientScopePayload(buildUserPayload(rawPayload)))

    assertUserCreateRequiredFields(payload)
    validateUserPayload(payload)
    assertUserScopeShape({
      primaryClientId: payload.primary_client_id,
      clientIds: payload.client_ids,
      allClients: payload.all_clients,
      roleId: payload.role,
    })
    await assertUserRelationsExist({
      Client,
      Role,
      primaryClientId: payload.primary_client_id,
      clientIds: payload.client_ids,
      roleId: payload.role,
    })

    const targetRole = await Role.findByPk(payload.role)
    assertRoleGrantAllowed({ auth: req.auth, targetRoleName: targetRole.description })

    if (payload.primary_client_id) {
      assertClientAccess(req.auth, payload.primary_client_id, 'No puedes asignar un cliente primario fuera de tu cobertura')
    }

    const normalizedClientIds = assertClientScopePayloadAllowed({
      auth: req.auth,
      payloadClientIds: payload.client_ids,
      allClients: payload.all_clients,
    })

    await assertUserUniqueFields({
      User,
      username: payload.username,
      email: payload.email,
    })

    const user = await User.sequelize.transaction(async (transaction) => {
      const hashedPassword = await bcrypt.hash(payload.password, 10)
      const persistedPayload = buildUserWritePayload({
        ...payload,
        password: hashedPassword,
      })

      const createdUser = await User.create(withCreateAudit(persistedPayload, req.auth), { transaction })

      await replaceUserClientScopes({
        userId: createdUser.id,
        clientIds: payload.all_clients ? [] : normalizedClientIds,
        transaction,
      })

      return createdUser
    })

    return success(res, 201, 'Usuario creado con exito', {
      user: await enrichUser(user),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'user')
    }

    return handleRequestError({
      context: 'users.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear el usuario: ',
      payloadKey: 'user',
    })
  }
}

const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'roleRecord', attributes: ['id', 'description'] }],
    })

    if (!user) {
      return failure(res, 404, 'Usuario no encontrado o no se realizaron cambios', { user: null })
    }

    await assertScopedUserManagementAllowed({ auth: req.auth, user })

    const currentClientIds = await listScopedClientIds(user.id)
    const rawPayload = pickAllowedFields(req.body, USER_UPDATE_FIELDS)
    const payload = normalizeClientScopePayload(buildUserPayload(rawPayload))
    const currentUser = user.toJSON()
    const nextScope = resolveTargetScope({
      payload,
      fallback: {
        primaryClientId: currentUser.client,
        clientIds: currentClientIds,
        allClients: Boolean(currentUser.all_clients),
      },
    })
    const nextPayload = {
      ...currentUser,
      ...payload,
      primary_client_id: nextScope.primaryClientId,
      client_ids: nextScope.clientIds,
      all_clients: nextScope.allClients,
    }

    assertUserUpdateAllowed({
      currentUser,
      payload,
      authUserId: req.auth?.userId,
    })
    assertUserPersistedRequiredFields(nextPayload)
    validateUserPayload(nextPayload)
    assertUserScopeShape({
      primaryClientId: nextScope.primaryClientId,
      clientIds: nextScope.clientIds,
      allClients: nextScope.allClients,
      roleId: nextPayload.role,
    })
    await assertUserRelationsExist({
      Client,
      Role,
      primaryClientId: nextScope.primaryClientId,
      clientIds: nextScope.clientIds,
      roleId: nextPayload.role,
    })
    await assertUserUniqueFields({
      User,
      username: nextPayload.username,
      email: nextPayload.email,
      excludeUserId: id,
    })
    const targetRole = await Role.findByPk(nextPayload.role)
    assertRoleGrantAllowed({ auth: req.auth, targetRoleName: targetRole.description })

    if (nextScope.primaryClientId) {
      assertClientAccess(req.auth, nextScope.primaryClientId, 'No puedes asignar un cliente primario fuera de tu cobertura')
    }

    const normalizedClientIds = assertClientScopePayloadAllowed({
      auth: req.auth,
      payloadClientIds: nextScope.clientIds,
      allClients: nextScope.allClients,
    })

    await User.sequelize.transaction(async (transaction) => {
      const updatePayload = buildUserWritePayload({
        ...payload,
        primary_client_id: nextScope.primaryClientId,
        all_clients: nextScope.allClients,
      })

      if (updatePayload.password) {
        updatePayload.password = await bcrypt.hash(updatePayload.password, 10)
      }

      await user.update(withUpdateAudit(updatePayload, req.auth), { transaction })
      await replaceUserClientScopes({
        userId: user.id,
        clientIds: nextScope.allClients ? [] : normalizedClientIds,
        transaction,
      })
    })

    await user.reload({
      include: [{ model: Role, as: 'roleRecord', attributes: ['id', 'description'] }],
    })

    return success(res, 200, 'Usuario actualizado con exito', {
      user: await enrichUser(user),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'user')
    }

    return handleRequestError({
      context: 'users.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar el usuario: ',
      payloadKey: 'user',
    })
  }
}

const destroyUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'roleRecord', attributes: ['id', 'description'] }],
    })

    if (!user) {
      return failure(res, 404, 'Usuario no encontrado', { user: null })
    }

    await assertScopedUserManagementAllowed({ auth: req.auth, user })

    const [requesterRequests, reviewedRequests, assignedOrders] = await Promise.all([
      Request.count({ where: { requester_user_id: user.id } }),
      Request.count({ where: { reviewed_by_user_id: user.id } }),
      Order.count({ where: { assigned_user_id: user.id } }),
    ])

    assertUserDeleteAllowed({
      targetUserId: user.id,
      authUserId: req.auth?.userId,
      relationCounts: { requesterRequests, reviewedRequests, assignedOrders },
    })

    await user.destroy()

    return success(res, 200, 'Usuario eliminado con exito', {
      user: await enrichUser(user),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'user')
    }

    return failure(res, 500, 'No fue posible eliminar el usuario', {
      user: null,
    })
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  destroyUser,
  login,
  getUserById,
}
