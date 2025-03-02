const router = require('express').Router()

const equipmentRouter = require('./equipments/equipment.routes')

router.use('/equipments', equipmentRouter)

module.exports = router
