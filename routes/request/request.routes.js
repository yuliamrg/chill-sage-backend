const router = require('express').Router()
const { createRequest, getRequests, updateRequest, destroyRequest } = require('../../controllers/requests/request.controller')



router.get('/', getRequests)
router.post('/', createRequest)
router.put('/:id', updateRequest)
router.delete('/:id', destroyRequest)

module.exports = router