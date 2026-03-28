const User = require('../models/Users/User.model')
const Role = require('../models/Roles/Role.model')
const { loadUserAccessContext } = require('./scope')
const { failure } = require('../utils/apiResponse')
const { verifyAccessToken } = require('./jwt')
const { buildRequestLogContext, logWarn } = require('../observability/logger')

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization)

    if (!token) {
      logWarn('auth.token.missing', buildRequestLogContext(req))
      return failure(res, 401, 'Token de autenticacion requerido', {})
    }

    const payload = verifyAccessToken(token)
    const user = await User.findByPk(payload.sub, {
      include: [{ model: Role, as: 'roleRecord', attributes: ['id', 'description'] }],
    })

    if (!user) {
      logWarn('auth.user.missing', buildRequestLogContext(req))
      return failure(res, 401, 'Usuario autenticado no encontrado', {})
    }

    if (user.status !== 'active') {
      logWarn('auth.user.inactive', {
        ...buildRequestLogContext(req),
        authUserId: user.id,
      })
      return failure(res, 401, 'Usuario inactivo', {})
    }

    const role = user.roleRecord

    if (!role) {
      logWarn('auth.role.invalid', {
        ...buildRequestLogContext(req),
        authUserId: user.id,
      })
      return failure(res, 403, 'Rol del usuario no valido', {})
    }

    req.auth = await loadUserAccessContext(user)

    return next()
  } catch (error) {
    logWarn('auth.token.invalid', {
      ...buildRequestLogContext(req),
      error: {
        name: error?.name,
        message: error?.message,
      },
    })
    return failure(res, 401, 'Token invalido o expirado', {})
  }
}

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth) {
    logWarn('auth.context.missing', buildRequestLogContext(req))
    return failure(res, 401, 'Autenticacion requerida', {})
  }

  if (!allowedRoles.includes(req.auth.roleName)) {
    logWarn('auth.role.denied', {
      ...buildRequestLogContext(req),
      allowedRoles,
    })
    return failure(res, 403, 'No tienes permisos para realizar esta accion', {})
  }

  return next()
}

module.exports = {
  requireAuth,
  requireRole,
}
