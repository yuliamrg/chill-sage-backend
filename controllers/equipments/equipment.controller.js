const Equipment = require('../../models/Equipments/Equipment.model')
const { Op } = require('sequelize')

const getEquipments = async (req, res) => {
  try {
    const equipments = await Equipment.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obeniendo equipos',
      equipments: equipments,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador equipment:' + error.message,
      equipments: [],
    })
  }
}

const createEquipment = async (req, res) => {
  try {
    const equipmentCreate = await Equipment.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'equipo creado con exito',
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
    res.status(201).json({
      status: true,
      msg: 'equipo actualizado con exito',
      equipment: equipmentUpdate,
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
        msg: 'equipo no encontrado',
        equipment: [],
      })
    }
    await equipment.destroy()
    res.status(200).json({
      status: true,
      msg: 'equipo eliminado con exito',
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
  createEquipment,
  updateEquipment,
  destroyEquipment,
}
