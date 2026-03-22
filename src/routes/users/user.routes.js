const router = require('express').Router()
const { createUser, getUsers, updateUser, destroyUser, getUserById } = require('../../controllers/users/user.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), getUsers)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), getUserById)
router.post('/', requireRole(ROLE_NAMES.ADMIN), createUser)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN), updateUser)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN), destroyUser)

module.exports = router
