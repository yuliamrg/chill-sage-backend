const router = require('express').Router()
const { createOrder, getOrders, getOrderById, updateOrder, destroyOrder } = require('../../controllers/orders/order.controller')



router.get('/', getOrders)
router.get('/:id', getOrderById)
router.post('/', createOrder)
router.put('/:id', updateOrder)
router.delete('/:id', destroyOrder)

module.exports = router
