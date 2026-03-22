const router = require('express').Router()
const {
  approveRequest,
  cancelRequest,
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  destroyRequest,
} = require('../../controllers/requests/request.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getRequests)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.SOLICITANTE), createRequest)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateRequest)
router.post('/:id/approve', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), approveRequest)
router.post('/:id/cancel', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), cancelRequest)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO, ROLE_NAMES.SOLICITANTE), getRequestById)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN), destroyRequest)

module.exports = router
