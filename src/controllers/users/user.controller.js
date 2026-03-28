const User = require('../../models/Users/User.model')
const Client = require('../../models/Clients/Client.model')
const Role = require('../../models/Roles/Role.model')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError, logRequestError } = require('../../utils/requestError')
const { signAccessToken, getJwtExpiresIn } = require('../../auth/jwt')
const { ROLE_IDS, ROLE_NAMES } = require('../../auth/roles')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

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
      return failure(res, 400, 'Debes enviar email o username junto con la contrasena', { user: null })
    }

    const user = await User.findOne({
      where: {
        [Op.or]: loginCandidates,
      },
    })

    if (!user) {
      return failure(res, 401, 'Usuario no encontrado', { user: null })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return failure(res, 401, 'Contrasena incorrecta', { user: null })
    }

    if (user.status !== 'active') {
      return failure(res, 401, 'Usuario inactivo', { user: null })
    }

    const enrichedUser = await enrichUser(user)
    const accessToken = signAccessToken({
      userId: user.id,
      roleId: user.role,
      roleName: enrichedUser.role_name,
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
    const users = await User.findAll()
    const hydratedUsers = await Promise.all(users.map(enrichUser))
    return success(res, 200, 'Obteniendo usuarios', {
      users: hydratedUsers,
    })
  } catch (error) {
    return failure(res, 500, 'No fue posible obtener usuarios', {
      users: [],
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
    const userPayload = pickAllowedFields(req.body, USER_CREATE_FIELDS)
    const { password } = userPayload

    if (!password) {
      return failure(res, 400, 'La contrasena es obligatoria', { user: null })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    userPayload.password = hashedPassword

    if (req.auth?.roleName !== ROLE_NAMES.ADMIN) {
      delete userPayload.role
      delete userPayload.status
    }

    if (!userPayload.status) {
      userPayload.status = 'active'
    }

    if (!userPayload.role) {
      userPayload.role = ROLE_IDS.SOLICITANTE
    }

    const userCreate = await User.create(withCreateAudit(userPayload, req.auth))
    return success(res, 201, 'Usuario creado con exito', {
      user: await enrichUser(userCreate),
    })
  } catch (error) {
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
    const userPayload = pickAllowedFields(req.body, USER_UPDATE_FIELDS)

    if (req.auth?.roleName !== ROLE_NAMES.ADMIN) {
      delete userPayload.role
      delete userPayload.status
    }

    if (userPayload.email) {
      const emailExists = await User.findOne({
        where: { email: userPayload.email, id: { [Op.ne]: id } },
      })

      if (emailExists) {
        return failure(res, 400, 'El email ya esta en uso', { user: null })
      }
    }

    if (userPayload.password) {
      const hashedPassword = await bcrypt.hash(userPayload.password, 10)
      userPayload.password = hashedPassword
    }

    const userUpdate = await User.update(withUpdateAudit(userPayload, req.auth), {
      where: {
        id: id,
      },
    })

    if (userUpdate[0] === 0) {
      return failure(res, 404, 'Usuario no encontrado o no se realizaron cambios', { user: null })
    }

    const updatedUser = await User.findByPk(id)

    return success(res, 200, 'Usuario actualizado con exito', {
      user: await enrichUser(updatedUser),
    })
  } catch (error) {
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

    await user.destroy()

    return success(res, 200, 'Usuario eliminado con exito', {
      user: await enrichUser(user),
    })
  } catch (error) {
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
