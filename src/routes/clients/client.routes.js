const router = require('express').Router()
const { createClient, getClients, getClientById, updateClient, destroyClient } = require('../../controllers/clients/client.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getClients)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getClientById)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), createClient)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateClient)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), destroyClient)

module.exports = router
