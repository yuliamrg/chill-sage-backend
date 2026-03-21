const Schedule = require('../../models/Schedules/Schedule.model')
const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo horarios',
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
      msg: 'Horario creado con exito',
      schedule: scheduleCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el horario: ' + error.message,
      schedule: [],
    })
  }
}

const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params
    const schedule = await Schedule.findByPk(id)

    if (!schedule) {
      return res.status(404).json({
        status: false,
        msg: 'Horario no encontrado',
        schedule: [],
      })
    }

    res.status(200).json({
      status: true,
      msg: 'Horario encontrado',
      schedule,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al obtener el horario: ' + error.message,
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

    if (scheduleUpdate[0] === 0) {
      return res.status(404).json({
        status: false,
        msg: 'Horario no encontrado o no se realizaron cambios',
        schedule: [],
      })
    }

    const updatedSchedule = await Schedule.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Horario actualizado con exito',
      schedule: updatedSchedule,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el horario: ' + error.message,
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
        msg: 'Horario no encontrado',
        schedule: [],
      })
    }
    await schedule.destroy()
    res.status(200).json({
      status: true,
      msg: 'Horario eliminado con exito',
      schedule: schedule,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el horario: ' + error.message,
      schedule: [],
    })
  }
}

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  destroySchedule,
}
