const Role = require('../../models/Roles/Role.model')
const { success, failure } = require('../../utils/apiResponse')
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll()
    return success(res, 200, 'Obteniendo roles', {
      roles: roles,
    })
  } catch (error) {
    return failure(res, 500, 'Error al conectar con el controlador role:' + error.message, {
      roles: [],
    })
  }
}

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params
    const role = await Role.findByPk(id)

    if (!role) {
      return failure(res, 404, 'Rol no encontrado', { role: null })
    }

    return success(res, 200, 'Rol encontrado', { role })
  } catch (error) {
    return failure(res, 500, 'Error al obtener el rol: ' + error.message, {
      role: null,
    })
  }
}

const createRole = async (req, res) => {
  try {
    const roleCreate = await Role.create(req.body)
    return success(res, 201, 'Rol creado con exito', {
      role: roleCreate,
    })
  } catch (error) {
    return failure(res, 500, 'Error al crear el rol: ' + error.message, {
      role: null,
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
      return failure(res, 404, 'Rol no encontrado o no se realizaron cambios', { role: null })
    }

    const updatedRole = await Role.findByPk(id)

    return success(res, 200, 'Rol actualizado con exito', {
      role: updatedRole,
    })
  } catch (error) {
    return failure(res, 500, 'Error al actualizar el rol: ' + error.message, {
      role: null,
    })
  }
}

const destroyRole = async (req, res) => {
  try {
    const { id } = req.params
    const role = await Role.findByPk(id)
    if (!role) {
      return failure(res, 404, 'Rol no encontrado', { role: null })
    }
    await role.destroy()
    return success(res, 200, 'Rol eliminado con exito', {
      role,
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar el rol: ' + error.message, {
      role: null,
    })
  }
}

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  destroyRole,
}
