const Schedule = require('../../models/Schedules/Schedule.model')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')
const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll()
    return success(res, 200, 'Obteniendo horarios', {
      schedules: schedules,
    })
  } catch (error) {
    return failure(res, 500, 'Error al conectar con el controlador schedule:' + error.message, {
      schedules: [],
    })
  }
}

const createSchedule = async (req, res) => {
  try {
    const scheduleCreate = await Schedule.create(req.body)
    return success(res, 201, 'Horario creado con exito', {
      schedule: scheduleCreate,
    })
  } catch (error) {
    return handleRequestError({
      context: 'schedules.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear el horario: ',
      payloadKey: 'schedule',
    })
  }
}

const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params
    const schedule = await Schedule.findByPk(id)

    if (!schedule) {
      return failure(res, 404, 'Horario no encontrado', { schedule: null })
    }

    return success(res, 200, 'Horario encontrado', {
      schedule,
    })
  } catch (error) {
    return failure(res, 500, 'Error al obtener el horario: ' + error.message, {
      schedule: null,
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
      return failure(res, 404, 'Horario no encontrado o no se realizaron cambios', { schedule: null })
    }

    const updatedSchedule = await Schedule.findByPk(id)

    return success(res, 200, 'Horario actualizado con exito', {
      schedule: updatedSchedule,
    })
  } catch (error) {
    return handleRequestError({
      context: 'schedules.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar el horario: ',
      payloadKey: 'schedule',
    })
  }
}

const destroySchedule = async (req, res) => {
  try {
    const { id } = req.params
    const schedule = await Schedule.findByPk(id)
    if (!schedule) {
      return failure(res, 404, 'Horario no encontrado', { schedule: null })
    }
    await schedule.destroy()
    return success(res, 200, 'Horario eliminado con exito', {
      schedule,
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar el horario: ' + error.message, {
      schedule: null,
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
