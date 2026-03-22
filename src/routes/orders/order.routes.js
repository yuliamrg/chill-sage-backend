const router = require('express').Router()
const {
  assignOrder,
  cancelOrder,
  completeOrder,
  createOrder,
  getOrders,
  getOrderById,
  startOrder,
  updateOrder,
  destroyOrder,
} = require('../../controllers/orders/order.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getOrders)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), createOrder)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateOrder)
router.post('/:id/assign', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), assignOrder)
router.post('/:id/start', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), startOrder)
router.post('/:id/complete', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), completeOrder)
router.post('/:id/cancel', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), cancelOrder)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getOrderById)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN), destroyOrder)

module.exports = router
