const router = require('express').Router()
const { createRequest, getRequests, getRequestById, updateRequest, destroyRequest } = require('../../controllers/requests/request.controller')



router.get('/', getRequests)
router.get('/:id', getRequestById)
router.post('/', createRequest)
router.put('/:id', updateRequest)
router.delete('/:id', destroyRequest)

module.exports = router
