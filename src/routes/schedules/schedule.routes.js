const router = require('express').Router()
const { createSchedule, getSchedules, updateSchedule, destroySchedule } = require('../../controllers/schedules/schedule.controller')



router.get('/', getSchedules)
router.post('/', createSchedule)
router.put('/:id', updateSchedule)
router.delete('/:id', destroySchedule)

module.exports = router