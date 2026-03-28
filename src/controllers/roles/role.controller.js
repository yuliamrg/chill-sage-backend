const Role = require('../../models/Roles/Role.model')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const ROLE_FIELDS = ['description']
const getRoles = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query, {
      allowedSortFields: ['id', 'description', 'created_at', 'updated_at'],
      defaultSort: { field: 'id', direction: 'ASC' },
    })
    const { count, rows } = await Role.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: pagination.order,
    })

    return success(res, 200, 'Obteniendo roles', {
      roles: rows,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        sort: pagination.sort,
        returned: rows.length,
      }),
    })
  } catch (error) {
    if (error instanceof PaginationQueryError) {
      return failure(res, 400, error.message, { roles: [], meta: null })
    }

    return failure(res, 500, 'No fue posible obtener roles', {
      roles: [],
      meta: null,
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
    return failure(res, 500, 'No fue posible obtener el rol', {
      role: null,
    })
  }
}

const createRole = async (req, res) => {
  try {
    const roleCreate = await Role.create(withCreateAudit(pickAllowedFields(req.body, ROLE_FIELDS), req.auth))
    return success(res, 201, 'Rol creado con exito', {
      role: roleCreate,
    })
  } catch (error) {
    return handleRequestError({
      context: 'roles.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear el rol: ',
      payloadKey: 'role',
    })
  }
}

const updateRole = async (req, res) => {
  const { id } = req.params
  try {
    const roleUpdate = await Role.update(withUpdateAudit(pickAllowedFields(req.body, ROLE_FIELDS), req.auth), {
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
    return handleRequestError({
      context: 'roles.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar el rol: ',
      payloadKey: 'role',
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
    return failure(res, 500, 'No fue posible eliminar el rol', {
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
