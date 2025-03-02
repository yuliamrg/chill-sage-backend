const router = require('express').Router()
const { createEquipment, getEquipments, updateEquipment, destroyEquipment } = require('../../controllers/equipments/equipment.controller')



router.get('/', getEquipments)
router.post('/', createEquipment)
router.put('/:id', updateEquipment)
router.delete('/:id', destroyEquipment)

module.exports = router