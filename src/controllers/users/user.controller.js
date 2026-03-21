const User = require('../../models/Users/User.model')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')

const sanitizeUser = (user) => {
  if (!user) {
    return null
  }

  const userData = typeof user.toJSON === 'function' ? user.toJSON() : user
  const { password, ...safeUser } = userData
  return safeUser
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
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Contrasena incorrecta' })
    }

    res.status(200).json({
      message: 'Inicio de sesion exitoso',
      user: sanitizeUser(user),
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al iniciar sesion: ' + error.message,
    })
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo usuarios',
      users: users.map(sanitizeUser),
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador users:' + error.message,
      users: [],
    })
  }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id)

    if (!user) {
      return res.status(404).json({
        status: false,
        msg: 'Usuario no encontrado',
        user: [],
      })
    }

    res.status(200).json({
      status: true,
      msg: 'Usuario encontrado',
      user: sanitizeUser(user),
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al obtener el usuario: ' + error.message,
      user: [],
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
    res.status(201).json({
      status: true,
      msg: 'Usuario creado con exito',
      user: sanitizeUser(userCreate),
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el usuario: ' + error.message,
      user: [],
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
        return res.status(400).json({ message: 'El email ya esta en uso' })
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
      return res.status(404).json({
        status: false,
        msg: 'Usuario no encontrado o no se realizaron cambios',
        user: [],
      })
    }

    const updatedUser = await User.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Usuario actualizado con exito',
      user: sanitizeUser(updatedUser),
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el usuario: ' + error.message,
      user: [],
    })
  }
}

const destroyUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id)

    if (!user) {
      return res.status(404).json({
        status: false,
        msg: 'Usuario no encontrado',
        user: [],
      })
    }

    await user.destroy()

    res.status(200).json({
      status: true,
      msg: 'Usuario eliminado con exito',
      user: sanitizeUser(user),
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el usuario: ' + error.message,
      user: [],
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
