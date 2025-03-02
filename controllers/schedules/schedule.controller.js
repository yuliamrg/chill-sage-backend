const Schedule = require('../../models/Schedules/Schedule.model')
const { Op } = require('sequelize')

const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obeniendo equipos',
      schedules: schedules,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador schedule:' + error.message,
      schedules: [],
    })
  }
}

const createSchedule = async (req, res) => {
  try {
    const scheduleCreate = await Schedule.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'equipo creado con exito',
      schedule: scheduleCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el equipo: ' + error.message,
      schedule: [],
    })
  }
}

const updateSchedule = async (req, res) => {
  const { id } = req.params
  try {
    const scheduleUpdate = await Schedule.update(req.body, {
      where: {
        id: id,
      },
    })
    res.status(201).json({
      status: true,
      msg: 'equipo actualizado con exito',
      schedule: scheduleUpdate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el equipo: ' + error.message,
      schedule: [],
    })
  }
}

const destroySchedule = async (req, res) => {
  try {
    const { id } = req.params
    const schedule = await Schedule.findByPk(id)
    if (!schedule) {
      return res.status(404).json({
        status: false,
        msg: 'equipo no encontrado',
        schedule: [],
      })
    }
    await schedule.destroy()
    res.status(200).json({
      status: true,
      msg: 'equipo eliminado con exito',
      schedule: schedule,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el equipo: ' + error.message,
      schedule: [],
    })
  }
}

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  destroySchedule,
}
