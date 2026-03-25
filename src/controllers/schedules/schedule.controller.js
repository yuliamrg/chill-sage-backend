const { Op } = require('sequelize')

const {
  SCHEDULE_ACTIONS,
  SCHEDULE_STATUSES,
  assertNoManualScheduleStateFields,
  assertScheduleActionAllowed,
  assertScheduleRequiredFields,
  assertScheduleUpdateAllowed,
} = require('../../domain/operations/schedulePolicy')
const { DomainError, buildDomainErrorResponse } = require('../../domain/shared/domainError')
const { Client, Equipment, Schedule, ScheduleEquipment } = require('../../models')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const SCHEDULE_FIELDS = ['client_id', 'name', 'type', 'scheduled_date', 'description']
const DISALLOWED_EQUIPMENT_STATUSES = new Set(['de_baja', 'retirado', 'retired'])

const parseDateValue = (value, fieldName) => {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError(400, `La fecha enviada para "${fieldName}" no es valida`)
  }

  return parsed
}

const normalizeEquipmentIds = (equipmentIds) => {
  if (!Array.isArray(equipmentIds) || !equipmentIds.length) {
    throw new DomainError(400, 'El cronograma requiere al menos un equipo asociado')
  }

  const normalized = [...new Set(equipmentIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))]

  if (!normalized.length) {
    throw new DomainError(400, 'El cronograma requiere equipment_ids validos')
  }

  return normalized
}

const validateSchedulePayload = async (payload, equipmentIds) => {
  assertScheduleRequiredFields(payload)

  const client = await Client.findByPk(payload.client_id)

  if (!client) {
    throw new DomainError(400, 'El cliente asociado no existe')
  }

  const equipments = await Equipment.findAll({
    where: {
      id: {
        [Op.in]: equipmentIds,
      },
    },
  })

  if (equipments.length !== equipmentIds.length) {
    throw new DomainError(400, 'Uno o varios equipos asociados no existen')
  }

  for (const equipment of equipments) {
    if (equipment.client !== payload.client_id) {
      throw new DomainError(400, 'Todos los equipos del cronograma deben pertenecer al mismo cliente')
    }

    if (equipment.status && DISALLOWED_EQUIPMENT_STATUSES.has(String(equipment.status).toLowerCase())) {
      throw new DomainError(400, 'Los equipos retirados o de baja no pueden programarse en cronogramas preventivos')
    }
  }

  return equipments
}

const hydrateSchedule = async (schedule) => {
  if (!schedule) {
    return null
  }

  const scheduleData = typeof schedule.toJSON === 'function' ? schedule.toJSON() : schedule
  const [client, relations] = await Promise.all([
    scheduleData.client_id ? Client.findByPk(scheduleData.client_id) : null,
    ScheduleEquipment.findAll({ where: { schedule_id: scheduleData.id } }),
  ])
  const equipmentIds = relations.map((relation) => relation.equipment_id)
  const equipments = equipmentIds.length
    ? await Equipment.findAll({
        where: {
          id: {
            [Op.in]: equipmentIds,
          },
        },
        order: [['id', 'ASC']],
      })
    : []

  return {
    ...scheduleData,
    client_name: client?.name ?? null,
    equipment_ids: equipmentIds,
    equipments: equipments.map((equipment) => ({
      id: equipment.id,
      name: equipment.name,
      code: equipment.code,
      status: equipment.status,
    })),
  }
}

const buildScheduleWhere = (req) => {
  const where = {}

  if (req.query.client_id) {
    where.client_id = Number(req.query.client_id)
  }

  if (req.query.status) {
    where.status = req.query.status
  }

  if (req.query.type) {
    where.type = req.query.type
  }

  if (req.query.date_from || req.query.date_to) {
    where.scheduled_date = {}

    if (req.query.date_from) {
      where.scheduled_date[Op.gte] = parseDateValue(req.query.date_from, 'date_from')
    }

    if (req.query.date_to) {
      where.scheduled_date[Op.lte] = parseDateValue(req.query.date_to, 'date_to')
    }
  }

  return where
}

const syncScheduleEquipments = async (scheduleId, equipmentIds) => {
  await ScheduleEquipment.destroy({ where: { schedule_id: scheduleId } })

  await ScheduleEquipment.bulkCreate(
    equipmentIds.map((equipmentId) => ({
      schedule_id: scheduleId,
      equipment_id: equipmentId,
    }))
  )
}

const getScheduleRecord = async (id) => {
  const schedule = await Schedule.findByPk(id)

  if (!schedule) {
    throw new DomainError(404, 'Cronograma no encontrado')
  }

  return schedule
}

const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      where: buildScheduleWhere(req),
      order: [['scheduled_date', 'DESC'], ['id', 'DESC']],
    })

    return success(res, 200, 'Obteniendo cronogramas', {
      schedules: await Promise.all(schedules.map(hydrateSchedule)),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'schedules')
    }

    return failure(res, 500, 'Error al conectar con el controlador schedule:' + error.message, {
      schedules: [],
    })
  }
}

const createSchedule = async (req, res) => {
  try {
    assertNoManualScheduleStateFields(req.body, 'POST')
    const payload = pickAllowedFields(req.body, SCHEDULE_FIELDS)
    const equipmentIds = normalizeEquipmentIds(req.body.equipment_ids)

    payload.scheduled_date = parseDateValue(payload.scheduled_date, 'scheduled_date')
    await validateSchedulePayload(payload, equipmentIds)

    const scheduleCreate = await Schedule.create(
      withCreateAudit(
        {
          ...payload,
          status: SCHEDULE_STATUSES.UNASSIGNED,
        },
        req.auth
      )
    )

    await syncScheduleEquipments(scheduleCreate.id, equipmentIds)

    return success(res, 201, 'Cronograma creado con exito', {
      schedule: await hydrateSchedule(scheduleCreate),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'schedule')
    }

    return handleRequestError({
      context: 'schedules.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear el cronograma: ',
      payloadKey: 'schedule',
    })
  }
}

const getScheduleById = async (req, res) => {
  try {
    const schedule = await getScheduleRecord(req.params.id)

    return success(res, 200, 'Cronograma encontrado', {
      schedule: await hydrateSchedule(schedule),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'schedule')
    }

    return failure(res, 500, 'Error al obtener el cronograma: ' + error.message, {
      schedule: null,
    })
  }
}

const updateSchedule = async (req, res) => {
  try {
    const schedule = await getScheduleRecord(req.params.id)
    assertScheduleUpdateAllowed({ schedule, payload: req.body })
    const payload = pickAllowedFields(req.body, SCHEDULE_FIELDS)
    const current = schedule.toJSON()
    const nextPayload = {
      ...current,
      ...payload,
    }
    const equipmentIds = req.body.equipment_ids ? normalizeEquipmentIds(req.body.equipment_ids) : null

    if (nextPayload.scheduled_date) {
      nextPayload.scheduled_date = parseDateValue(nextPayload.scheduled_date, 'scheduled_date')
      payload.scheduled_date = nextPayload.scheduled_date
    }

    const effectiveEquipmentIds = equipmentIds || (await hydrateSchedule(schedule)).equipment_ids
    await validateSchedulePayload(nextPayload, effectiveEquipmentIds)

    await schedule.update(withUpdateAudit(payload, req.auth))

    if (equipmentIds) {
      await syncScheduleEquipments(schedule.id, equipmentIds)
    }

    return success(res, 200, 'Cronograma actualizado con exito', {
      schedule: await hydrateSchedule(schedule),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'schedule')
    }

    return handleRequestError({
      context: 'schedules.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar el cronograma: ',
      payloadKey: 'schedule',
    })
  }
}

const openSchedule = async (req, res) => {
  try {
    const schedule = await getScheduleRecord(req.params.id)
    assertScheduleActionAllowed({
      action: SCHEDULE_ACTIONS.OPEN,
      schedule,
    })

    await schedule.update(
      withUpdateAudit(
        {
          status: SCHEDULE_STATUSES.OPEN,
        },
        req.auth
      )
    )

    return success(res, 200, 'Cronograma abierto con exito', {
      schedule: await hydrateSchedule(schedule),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'schedule')
    }

    return handleRequestError({
      context: 'schedules.open',
      req,
      res,
      error,
      fallbackMessage: 'Error al abrir el cronograma: ',
      payloadKey: 'schedule',
    })
  }
}

const closeSchedule = async (req, res) => {
  try {
    const schedule = await getScheduleRecord(req.params.id)
    assertScheduleActionAllowed({
      action: SCHEDULE_ACTIONS.CLOSE,
      schedule,
    })

    await schedule.update(
      withUpdateAudit(
        {
          status: SCHEDULE_STATUSES.CLOSED,
        },
        req.auth
      )
    )

    return success(res, 200, 'Cronograma cerrado con exito', {
      schedule: await hydrateSchedule(schedule),
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'schedule')
    }

    return handleRequestError({
      context: 'schedules.close',
      req,
      res,
      error,
      fallbackMessage: 'Error al cerrar el cronograma: ',
      payloadKey: 'schedule',
    })
  }
}

const destroySchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id)

    if (!schedule) {
      return failure(res, 404, 'Cronograma no encontrado', { schedule: null })
    }

    await ScheduleEquipment.destroy({ where: { schedule_id: schedule.id } })
    await schedule.destroy()

    return success(res, 200, 'Cronograma eliminado con exito', {
      schedule: await hydrateSchedule(schedule),
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar el cronograma: ' + error.message, {
      schedule: null,
    })
  }
}

module.exports = {
  closeSchedule,
  createSchedule,
  destroySchedule,
  getScheduleById,
  getSchedules,
  openSchedule,
  updateSchedule,
}
