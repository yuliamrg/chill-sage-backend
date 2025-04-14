const router = require('express').Router()
const { createUser, getUsers, updateUser, destroyUser, login, getUserById } = require('../../controllers/users/user.controller')

router.get('/', getUsers)
router.get('/:id', getUserById)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', destroyUser)
router.post('/login', login)

module.exports = router