const router = require('express').Router()
const { createClient, getClients, updateClient, destroyClient } = require('../../controllers/clients/client.controller')



router.get('/', getClients)
router.post('/', createClient)
router.put('/:id', updateClient)
router.delete('/:id', destroyClient)

module.exports = router