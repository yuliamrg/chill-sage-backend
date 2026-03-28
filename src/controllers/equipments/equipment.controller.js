const Equipment = require('../../models/Equipments/Equipment.model')
const Client = require('../../models/Clients/Client.model')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const EQUIPMENT_FIELDS = ['name', 'type', 'location', 'brand', 'model', 'serial', 'code', 'alias', 'client', 'description', 'status', 'use_start_at', 'use_end_at']

const enrichEquipment = async (equipment) => {
  if (!equipment) {
    return null
  }

  const equipmentData = typeof equipment.toJSON === 'function' ? equipment.toJSON() : equipment
  const client = equipmentData.client ? await Client.findByPk(equipmentData.client) : null

  return {
    ...equipmentData,
    client_name: client?.name ?? null,
  }
}

const getEquipments = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query, {
      allowedSortFields: ['id', 'name', 'type', 'status', 'code', 'serial', 'created_at', 'updated_at'],
      defaultSort: { field: 'created_at', direction: 'DESC' },
    })
    const { count, rows } = await Equipment.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: pagination.order,
    })
    const hydratedEquipments = await Promise.all(rows.map(enrichEquipment))

    return success(res, 200, 'Obteniendo equipos', {
      equipments: hydratedEquipments,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        sort: pagination.sort,
        returned: hydratedEquipments.length,
      }),
    })
  } catch (error) {
    if (error instanceof PaginationQueryError) {
      return failure(res, 400, error.message, { equipments: [], meta: null })
    }

    return failure(res, 500, 'No fue posible obtener equipos', {
      equipments: [],
      meta: null,
    })
  }
}

const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params
    const equipment = await Equipment.findByPk(id)

    if (!equipment) {
      return failure(res, 404, 'Equipo no encontrado', { equipment: null })
    }

    return success(res, 200, 'Equipo encontrado', {
      equipment: await enrichEquipment(equipment),
    })
  } catch (error) {
    return failure(res, 500, 'No fue posible obtener el equipo', {
      equipment: null,
    })
  }
}

const createEquipment = async (req, res) => {
  try {
    const equipmentCreate = await Equipment.create(withCreateAudit(pickAllowedFields(req.body, EQUIPMENT_FIELDS), req.auth))
    return success(res, 201, 'Equipo creado con exito', {
      equipment: await enrichEquipment(equipmentCreate),
    })
  } catch (error) {
    return handleRequestError({
      context: 'equipments.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear el equipo: ',
      payloadKey: 'equipment',
    })
  }
}

const updateEquipment = async (req, res) => {
  const { id } = req.params
  try {
    const equipmentUpdate = await Equipment.update(withUpdateAudit(pickAllowedFields(req.body, EQUIPMENT_FIELDS), req.auth), {
      where: {
        id: id,
      },
    })

    if (equipmentUpdate[0] === 0) {
      return failure(res, 404, 'Equipo no encontrado o no se realizaron cambios', { equipment: null })
    }

    const updatedEquipment = await Equipment.findByPk(id)

    return success(res, 200, 'Equipo actualizado con exito', {
      equipment: await enrichEquipment(updatedEquipment),
    })
  } catch (error) {
    return handleRequestError({
      context: 'equipments.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar el equipo: ',
      payloadKey: 'equipment',
    })
  }
}

const destroyEquipment = async (req, res) => {
  try {
    const { id } = req.params
    const equipment = await Equipment.findByPk(id)
    if (!equipment) {
      return failure(res, 404, 'Equipo no encontrado', { equipment: null })
    }
    await equipment.destroy()
    return success(res, 200, 'Equipo eliminado con exito', {
      equipment: await enrichEquipment(equipment),
    })
  } catch (error) {
    return failure(res, 500, 'No fue posible eliminar el equipo', {
      equipment: null,
    })
  }
}

module.exports = {
  getEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  destroyEquipment,
}
