const router = require('express').Router()
const { createRole, getRoles, getRoleById, updateRole, destroyRole } = require('../../controllers/roles/role.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), getRoles)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), getRoleById)
router.post('/', requireRole(ROLE_NAMES.ADMIN), createRole)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN), updateRole)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN), destroyRole)

module.exports = router
