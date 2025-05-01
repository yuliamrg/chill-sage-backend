const User = require('../../models/Users/User.model')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')

const login = async (req, res) => {
  const { email, username, password } = req.body
  // Allow login with email or username
  const user = await User.findOne({ 
    where: { 
      [Op.or]: [
        { email: email },
        { username: username }
      ]
    } 
  })
  if (!user) {
    return res.status(401).json({ message: 'Usuario no encontrado' })
  }
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Contraseña incorrecta' })
  }
  res.status(200).json({ message: 'Inicio de sesión exitoso', user: user })
}

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo usuarios',
      users: users,
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
    user: user,
  })
}

const createUser = async (req, res) => {
  try {
    const { password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    req.body.password = hashedPassword
    
    // Set default status if not provided
    if (!req.body.status) {
      req.body.status = 'active';
    }
    
    // Set default role if not provided 
    if (!req.body.role) {
      req.body.role = 2; // Default to role ID 2 (regular user)
    }
    
    const userCreate = await User.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'Usuario creado con éxito',
      user: userCreate,
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
        return res.status(400).json({ message: 'El email ya está en uso' })
      }
    }

    // Only hash password if it's provided in the request
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
    
    res.status(200).json({
      status: true,
      msg: 'Usuario actualizado con éxito',
      user: userUpdate,
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
      user: user,
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
