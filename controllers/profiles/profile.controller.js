const Profile = require('../../models/Profiles/Profile.model')
const { Op } = require('sequelize')

const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obeniendo perfiles',
      profiles: profiles,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador profile:' + error.message,
      profiles: [],
    })
  }
}

const createProfile = async (req, res) => {
  try {
    const profileCreate = await Profile.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'perfil creado con exito',
      profile: profileCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el perfil: ' + error.message,
      profile: [],
    })
  }
}

const updateProfile = async (req, res) => {
  const { id } = req.params
  try {
    const profileUpdate = await Profile.update(req.body, {
      where: {
        id: id,
      },
    })
    res.status(201).json({
      status: true,
      msg: 'perfil actualizado con exito',
      profile: profileUpdate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el perfil: ' + error.message,
      profile: [],
    })
  }
}

const destroyProfile = async (req, res) => {
  try {
    const { id } = req.params
    const profile = await profile.findByPk(id)
    if (!profile) {
      return res.status(404).json({
        status: false,
        msg: 'perfil no encontrado',
        profile: [],
      })
    }
    await profile.destroy()
    res.status(200).json({
      status: true,
      msg: 'perfil eliminado con exito',
      profile: profile,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el perfil: ' + error.message,
      profile: [],
    })
  }
}

module.exports = {
  getProfiles,
  createProfile,
  updateProfile,
  destroyProfile,
}
