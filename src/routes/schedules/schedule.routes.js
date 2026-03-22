const router = require('express').Router()
const { createSchedule, getSchedules, getScheduleById, updateSchedule, destroySchedule } = require('../../controllers/schedules/schedule.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getSchedules)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getScheduleById)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), createSchedule)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateSchedule)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), destroySchedule)

module.exports = router
