const router = require('express').Router()
const { createProfile, getProfiles, getProfileById, updateProfile, destroyProfile } = require('../../controllers/profiles/profile.controller')
const { requireRole } = require('../../auth/middleware')
const { ROLE_NAMES } = require('../../auth/roles')

router.get('/', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE), getProfiles)
router.get('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA, ROLE_NAMES.ADMIN_CLIENTE), getProfileById)
router.post('/', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA), createProfile)
router.put('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA), updateProfile)
router.delete('/:id', requireRole(ROLE_NAMES.ADMIN_PLATAFORMA), destroyProfile)

module.exports = router
