const router = require('express').Router()
const { createRequest, getRequests, getRequestById, updateRequest, destroyRequest } = require('../../controllers/requests/request.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getRequests)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getRequestById)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.SOLICITANTE), createRequest)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateRequest)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), destroyRequest)

module.exports = router
