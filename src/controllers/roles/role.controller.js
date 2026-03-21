const Role = require('../../models/Roles/Role.model')
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo roles',
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
      msg: 'Rol creado con exito',
      role: roleCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el rol: ' + error.message,
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

    if (roleUpdate[0] === 0) {
      return res.status(404).json({
        status: false,
        msg: 'Rol no encontrado o no se realizaron cambios',
        role: [],
      })
    }

    const updatedRole = await Role.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Rol actualizado con exito',
      role: updatedRole,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el rol: ' + error.message,
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
        msg: 'Rol no encontrado',
        role: [],
      })
    }
    await role.destroy()
    res.status(200).json({
      status: true,
      msg: 'Rol eliminado con exito',
      role: role,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el rol: ' + error.message,
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
