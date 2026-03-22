const router = require('express').Router()
const {
  closeSchedule,
  createSchedule,
  getSchedules,
  getScheduleById,
  openSchedule,
  updateSchedule,
  destroySchedule,
} = require('../../controllers/schedules/schedule.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getSchedules)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), createSchedule)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateSchedule)
router.post('/:id/open', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), openSchedule)
router.post('/:id/close', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), closeSchedule)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getScheduleById)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN), destroySchedule)

module.exports = router
