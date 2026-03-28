const router = require('express').Router()
const { createEquipment, getEquipments, getEquipmentById, updateEquipment, destroyEquipment } = require('../../controllers/equipments/equipment.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getEquipments)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR, ROLE_NAMES.TECNICO), getEquipmentById)
router.post('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), createEquipment)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), updateEquipment)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN), destroyEquipment)

module.exports = router
