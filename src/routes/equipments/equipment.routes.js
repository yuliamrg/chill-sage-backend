const router = require('express').Router()
const { createEquipment, getEquipments, getEquipmentById, updateEquipment, destroyEquipment } = require('../../controllers/equipments/equipment.controller')



router.get('/', getEquipments)
router.get('/:id', getEquipmentById)
router.post('/', createEquipment)
router.put('/:id', updateEquipment)
router.delete('/:id', destroyEquipment)

module.exports = router
