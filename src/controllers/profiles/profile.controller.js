const Profile = require('../../models/Profiles/Profile.model')
const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo perfiles',
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
      msg: 'Perfil creado con exito',
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

    if (profileUpdate[0] === 0) {
      return res.status(404).json({
        status: false,
        msg: 'Perfil no encontrado o no se realizaron cambios',
        profile: [],
      })
    }

    const updatedProfile = await Profile.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Perfil actualizado con exito',
      profile: updatedProfile,
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
    const profile = await Profile.findByPk(id)
    if (!profile) {
      return res.status(404).json({
        status: false,
        msg: 'Perfil no encontrado',
        profile: [],
      })
    }
    await profile.destroy()
    res.status(200).json({
      status: true,
      msg: 'Perfil eliminado con exito',
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
