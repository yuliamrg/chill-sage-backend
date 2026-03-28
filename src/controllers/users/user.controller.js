const User = require('../../models/Users/User.model')
const Client = require('../../models/Clients/Client.model')
const Role = require('../../models/Roles/Role.model')
const Order = require('../../models/Orders/Order.model')
const Request = require('../../models/Requests/request.model')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const {
  assertUserCreateRequiredFields,
  assertUserDeleteAllowed,
  assertUserPersistedRequiredFields,
  assertUserRelationsExist,
  assertUserUniqueFields,
  assertUserUpdateAllowed,
  buildUserPayload,
  resolveCreateDefaults,
  validateUserPayload,
} = require('../../domain/operations/userPolicy')
const { DomainError, buildDomainErrorResponse } = require('../../domain/shared/domainError')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { handleRequestError, logRequestError } = require('../../utils/requestError')
const { signAccessToken, getJwtExpiresIn } = require('../../auth/jwt')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')
const { buildRequestLogContext, logInfo, logWarn } = require('../../observability/logger')

const USER_CREATE_FIELDS = ['username', 'name', 'last_name', 'email', 'password', 'client', 'role', 'status']
const USER_UPDATE_FIELDS = ['username', 'name', 'last_name', 'email', 'password', 'client', 'role', 'status']

const sanitizeUser = (user) => {
  if (!user) {
    return null
  }

  const userData = typeof user.toJSON === 'function' ? user.toJSON() : user
  const { password, ...safeUser } = userData
  return safeUser
}

const enrichUser = async (user) => {
  const safeUser = sanitizeUser(user)

  if (!safeUser) {
    return null
  }

  const [client, role] = await Promise.all([
    safeUser.client ? Client.findByPk(safeUser.client) : null,
    safeUser.role ? Role.findByPk(safeUser.role) : null,
  ])

  return {
    ...safeUser,
    client_name: client?.name ?? null,
    role_name: role?.description ?? null,
  }
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
      roleName: enrichedUser.role_name,
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
    const { count, rows } = await User.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: pagination.order,
    })
    const hydratedUsers = await Promise.all(rows.map(enrichUser))

    return success(res, 200, 'Obteniendo usuarios', {
      users: hydratedUsers,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: count,
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
    const user = await User.findByPk(id)

    if (!user) {
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
    const payload = resolveCreateDefaults(buildUserPayload(pickAllowedFields(req.body, USER_CREATE_FIELDS)))

    assertUserCreateRequiredFields(payload)
    validateUserPayload(payload)
    await assertUserRelationsExist({
      Client,
      Role,
      clientId: payload.client,
      roleId: payload.role,
    })
    await assertUserUniqueFields({
      User,
      username: payload.username,
      email: payload.email,
    })

    const hashedPassword = await bcrypt.hash(payload.password, 10)
    payload.password = hashedPassword

    const userCreate = await User.create(withCreateAudit(payload, req.auth))
    return success(res, 201, 'Usuario creado con exito', {
      user: await enrichUser(userCreate),
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
    const user = await User.findByPk(id)

    if (!user) {
      return failure(res, 404, 'Usuario no encontrado o no se realizaron cambios', { user: null })
    }

    const payload = buildUserPayload(pickAllowedFields(req.body, USER_UPDATE_FIELDS))
    const currentUser = user.toJSON()
    const nextPayload = {
      ...currentUser,
      ...payload,
    }

    assertUserPersistedRequiredFields(nextPayload)
    validateUserPayload(nextPayload)
    await assertUserRelationsExist({
      Client,
      Role,
      clientId: nextPayload.client,
      roleId: nextPayload.role,
    })
    await assertUserUniqueFields({
      User,
      username: nextPayload.username,
      email: nextPayload.email,
      excludeUserId: id,
    })
    assertUserUpdateAllowed({
      currentUser,
      payload,
      authUserId: req.auth?.userId,
    })

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10)
    }

    await user.update(withUpdateAudit(payload, req.auth))

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
    const user = await User.findByPk(id)

    if (!user) {
      return failure(res, 404, 'Usuario no encontrado', { user: null })
    }

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
