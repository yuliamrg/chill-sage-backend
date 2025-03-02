const router = require('express').Router()
const { createOrder, getOrders, updateOrder, destroyOrder } = require('../../controllers/orders/order.controller')



router.get('/', getOrders)
router.post('/', createOrder)
router.put('/:id', updateOrder)
router.delete('/:id', destroyOrder)

module.exports = router