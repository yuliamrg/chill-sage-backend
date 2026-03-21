const router = require('express').Router()
const { createSchedule, getSchedules, getScheduleById, updateSchedule, destroySchedule } = require('../../controllers/schedules/schedule.controller')



router.get('/', getSchedules)
router.get('/:id', getScheduleById)
router.post('/', createSchedule)
router.put('/:id', updateSchedule)
router.delete('/:id', destroySchedule)

module.exports = router
