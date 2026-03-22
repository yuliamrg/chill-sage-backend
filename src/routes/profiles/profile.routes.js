const router = require('express').Router()
const { createProfile, getProfiles, getProfileById, updateProfile, destroyProfile } = require('../../controllers/profiles/profile.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), getProfiles)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.PLANEADOR), getProfileById)
router.post('/', requireRole(ROLE_NAMES.ADMIN), createProfile)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN), updateProfile)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN), destroyProfile)

module.exports = router
