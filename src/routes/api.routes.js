const router = require('express').Router()

const equipmentRouter = require('./equipments/equipment.routes')
const userRouter = require('./users/user.routes')
const roleRouter = require('./roles/role.routes')
const scheduleRouter = require('./schedules/schedule.routes')
const requestRouter = require('./requests/request.routes')
const clientRouter = require('./clients/client.routes')
const profileRouter = require('./profiles/profile.routes')
const orderRouter = require('./orders/order.routes')

router.use('/users', userRouter)
router.use('/clients', clientRouter)
router.use('/roles', roleRouter)
router.use('/schedules', scheduleRouter)
router.use('/requests', requestRouter)
router.use('/profiles', profileRouter)
router.use('/orders', orderRouter)
router.use('/equipments', equipmentRouter)

module.exports = router
