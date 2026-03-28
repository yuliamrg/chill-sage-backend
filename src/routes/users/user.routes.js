const router = require('express').Router()
const { createUser, getUsers, updateUser, destroyUser, getUserById } = require('../../controllers/users/user.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE, ROLE_NAMES.PLANEADOR), getUsers)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE, ROLE_NAMES.PLANEADOR), getUserById)
router.post('/', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE), createUser)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE), updateUser)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE), destroyUser)

module.exports = router
