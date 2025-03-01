const router = require('express').Router()

const brandRouter = require('./parameters/brands/brand.routes')

router.use('/brands', brandRouter)

module.exports = router
