const User = require('../../models/Users/User.model')
const Client = require('../../models/Clients/Client.model')
const Role = require('../../models/Roles/Role.model')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError, logRequestError } = require('../../utils/requestError')

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
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    })

    if (!user) {
      return failure(res, 401, 'Usuario no encontrado', { user: null })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return failure(res, 401, 'Contrasena incorrecta', { user: null })
    }

    return success(res, 200, 'Inicio de sesion exitoso', {
      user: await enrichUser(user),
    })
  } catch (error) {
    logRequestError('users.login', req, error)
    return failure(res, 500, 'Error al iniciar sesion: ' + error.message, {
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
    return failure(res, 500, 'Error al conectar con el controlador users:' + error.message, {
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
    return failure(res, 500, 'Error al obtener el usuario: ' + error.message, {
      user: null,
    })
  }
}

const createUser = async (req, res) => {
  try {
    const { password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    req.body.password = hashedPassword

    if (!req.body.status) {
      req.body.status = 'active'
    }

    if (!req.body.role) {
      req.body.role = 2
    }

    const userCreate = await User.create(req.body)
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

    if (req.body.email) {
      const emailExists = await User.findOne({
        where: { email: req.body.email, id: { [Op.ne]: id } },
      })

      if (emailExists) {
        return failure(res, 400, 'El email ya esta en uso', { user: null })
      }
    }

    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      req.body.password = hashedPassword
    }

    const userUpdate = await User.update(req.body, {
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
    return failure(res, 500, 'Error al eliminar el usuario: ' + error.message, {
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
