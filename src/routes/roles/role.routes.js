const router = require('express').Router()
const { createRole, getRoles, getRoleById, updateRole, destroyRole } = require('../../controllers/roles/role.controller')



router.get('/', getRoles)
router.get('/:id', getRoleById)
router.post('/', createRole)
router.put('/:id', updateRole)
router.delete('/:id', destroyRole)

module.exports = router
