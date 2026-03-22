const router = require('express').Router()
const { createOrder, getOrders, getOrderById, updateOrder, destroyOrder } = require('../../controllers/orders/order.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getOrders)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getOrderById)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), createOrder)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateOrder)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), destroyOrder)

module.exports = router
