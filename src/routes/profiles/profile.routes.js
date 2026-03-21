const router = require('express').Router()
const { createProfile, getProfiles, getProfileById, updateProfile, destroyProfile } = require('../../controllers/profiles/profile.controller')



router.get('/', getProfiles)
router.get('/:id', getProfileById)
router.post('/', createProfile)
router.put('/:id', updateProfile)
router.delete('/:id', destroyProfile)

module.exports = router
