const router = require('express').Router()
const { createClient, getClients, getClientById, updateClient, destroyClient } = require('../../controllers/clients/client.controller')



router.get('/', getClients)
router.get('/:id', getClientById)
router.post('/', createClient)
router.put('/:id', updateClient)
router.delete('/:id', destroyClient)

module.exports = router
