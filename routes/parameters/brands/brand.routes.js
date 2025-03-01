const router = require('express').Router()
const { create,destroy,index,update } = require('../../../controllers/parameters/brands/brands.controller')



router.get('/', index)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', destroy)

module.exports = router