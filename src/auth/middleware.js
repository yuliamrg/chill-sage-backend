const User = require('../models/Users/User.model')
const Role = require('../models/Roles/Role.model')
const { failure } = require('../utils/apiResponse')
const { verifyAccessToken } = require('./jwt')

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
      return failure(res, 401, 'Token de autenticacion requerido', {})
    }

    const payload = verifyAccessToken(token)
    const user = await User.findByPk(payload.sub)

    if (!user) {
      return failure(res, 401, 'Usuario autenticado no encontrado', {})
    }

    if (user.status !== 'active') {
      return failure(res, 401, 'Usuario inactivo', {})
    }

    const role = await Role.findByPk(user.role)

    if (!role) {
      return failure(res, 403, 'Rol del usuario no valido', {})
    }

    req.auth = {
      userId: user.id,
      roleId: role.id,
      roleName: role.description,
    }

    return next()
  } catch (error) {
    return failure(res, 401, 'Token invalido o expirado', {})
  }
}

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth) {
    return failure(res, 401, 'Autenticacion requerida', {})
  }

  if (!allowedRoles.includes(req.auth.roleName)) {
    return failure(res, 403, 'No tienes permisos para realizar esta accion', {})
  }

  return next()
}

module.exports = {
  requireAuth,
  requireRole,
}
