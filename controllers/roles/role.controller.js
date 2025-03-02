const Role = require('../../models/Roles/Role.model')
const { Op } = require('sequelize')

const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obeniendo equipos',
      roles: roles,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador role:' + error.message,
      roles: [],
    })
  }
}

const createRole = async (req, res) => {
  try {
    const roleCreate = await Role.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'equipo creado con exito',
      role: roleCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el equipo: ' + error.message,
      role: [],
    })
  }
}

const updateRole = async (req, res) => {
  const { id } = req.params
  try {
    const roleUpdate = await Role.update(req.body, {
      where: {
        id: id,
      },
    })
    res.status(201).json({
      status: true,
      msg: 'equipo actualizado con exito',
      role: roleUpdate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el equipo: ' + error.message,
      role: [],
    })
  }
}

const destroyRole = async (req, res) => {
  try {
    const { id } = req.params
    const role = await Role.findByPk(id)
    if (!role) {
      return res.status(404).json({
        status: false,
        msg: 'equipo no encontrado',
        role: [],
      })
    }
    await role.destroy()
    res.status(200).json({
      status: true,
      msg: 'equipo eliminado con exito',
      role: role,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el equipo: ' + error.message,
      role: [],
    })
  }
}

module.exports = {
  getRoles,
  createRole,
  updateRole,
  destroyRole,
}
