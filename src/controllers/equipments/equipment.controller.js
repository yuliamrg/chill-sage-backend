const Equipment = require('../../models/Equipments/Equipment.model')
const Client = require('../../models/Clients/Client.model')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')

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
    const equipments = await Equipment.findAll()
    const hydratedEquipments = await Promise.all(equipments.map(enrichEquipment))
    return success(res, 200, 'Obteniendo equipos', {
      equipments: hydratedEquipments,
    })
  } catch (error) {
    return failure(res, 500, 'Error al conectar con el controlador equipment:' + error.message, {
      equipments: [],
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
    return failure(res, 500, 'Error al obtener el equipo: ' + error.message, {
      equipment: null,
    })
  }
}

const createEquipment = async (req, res) => {
  try {
    const equipmentCreate = await Equipment.create(req.body)
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
    const equipmentUpdate = await Equipment.update(req.body, {
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
    return failure(res, 500, 'Error al eliminar el equipo: ' + error.message, {
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
