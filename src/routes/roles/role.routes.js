const router = require('express').Router()
const { createRole, getRoles, getRoleById, updateRole, destroyRole } = require('../../controllers/roles/role.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE), getRoles)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE), getRoleById)
router.post('/', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA), createRole)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA), updateRole)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA), destroyRole)

module.exports = router
