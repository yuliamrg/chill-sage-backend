const User = require('../../models/Users/User.model')
const { Op } = require('sequelize')

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obeniendo equipos',
      users: users,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador user:' + error.message,
      users: [],
    })
  }
}

const createUser = async (req, res) => {
  try {
    const userCreate = await User.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'equipo creado con exito',
      user: userCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el equipo: ' + error.message,
      user: [],
    })
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  try {
    const userUpdate = await User.update(req.body, {
      where: {
        id: id,
      },
    })
    res.status(201).json({
      status: true,
      msg: 'equipo actualizado con exito',
      user: userUpdate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el equipo: ' + error.message,
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
        msg: 'equipo no encontrado',
        user: [],
      })
    }
    await user.destroy()
    res.status(200).json({
      status: true,
      msg: 'equipo eliminado con exito',
      user: user,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el equipo: ' + error.message,
      user: [],
    })
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  destroyUser,
}
