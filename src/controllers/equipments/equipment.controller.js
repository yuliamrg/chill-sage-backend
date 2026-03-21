const Equipment = require('../../models/Equipments/Equipment.model')
const Client = require('../../models/Clients/Client.model')

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
    res.status(200).json({
      status: true,
      msg: 'Obteniendo equipos',
      equipments: hydratedEquipments,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador equipment:' + error.message,
      equipments: [],
    })
  }
}

const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params
    const equipment = await Equipment.findByPk(id)

    if (!equipment) {
      return res.status(404).json({
        status: false,
        msg: 'Equipo no encontrado',
        equipment: [],
      })
    }

    res.status(200).json({
      status: true,
      msg: 'Equipo encontrado',
      equipment: await enrichEquipment(equipment),
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al obtener el equipo: ' + error.message,
      equipment: [],
    })
  }
}

const createEquipment = async (req, res) => {
  try {
    const equipmentCreate = await Equipment.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'Equipo creado con exito',
      equipment: equipmentCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el equipo: ' + error.message,
      equipment: [],
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
      return res.status(404).json({
        status: false,
        msg: 'Equipo no encontrado o no se realizaron cambios',
        equipment: [],
      })
    }

    const updatedEquipment = await Equipment.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Equipo actualizado con exito',
      equipment: updatedEquipment,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el equipo: ' + error.message,
      equipment: [],
    })
  }
}

const destroyEquipment = async (req, res) => {
  try {
    const { id } = req.params
    const equipment = await Equipment.findByPk(id)
    if (!equipment) {
      return res.status(404).json({
        status: false,
        msg: 'Equipo no encontrado',
        equipment: [],
      })
    }
    await equipment.destroy()
    res.status(200).json({
      status: true,
      msg: 'Equipo eliminado con exito',
      equipment: equipment,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el equipo: ' + error.message,
      equipment: [],
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
