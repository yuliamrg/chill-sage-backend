const router = require('express').Router()
const { createUser, getUsers, updateUser, destroyUser } = require('../../controllers/users/user.controller')



router.get('/', getUsers)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', destroyUser)

module.exports = router