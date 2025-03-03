const router = require('express').Router()
const { createRole, getRoles, updateRole, destroyRole } = require('../../controllers/roles/role.controller')



router.get('/', getRoles)
router.post('/', createRole)
router.put('/:id', updateRole)
router.delete('/:id', destroyRole)

module.exports = router