const Profile = require('../../models/Profiles/Profile.model')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const PROFILE_FIELDS = ['description']
const getProfiles = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query, {
      allowedSortFields: ['id', 'description', 'created_at', 'updated_at'],
      defaultSort: { field: 'id', direction: 'ASC' },
    })
    const { count, rows } = await Profile.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: pagination.order,
    })

    return success(res, 200, 'Obteniendo perfiles', {
      profiles: rows,
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        sort: pagination.sort,
        returned: rows.length,
      }),
    })
  } catch (error) {
    if (error instanceof PaginationQueryError) {
      return failure(res, 400, error.message, { profiles: [], meta: null })
    }

    return failure(res, 500, 'No fue posible obtener perfiles', {
      profiles: [],
      meta: null,
    })
  }
}

const getProfileById = async (req, res) => {
  try {
    const { id } = req.params
    const profile = await Profile.findByPk(id)

    if (!profile) {
      return failure(res, 404, 'Perfil no encontrado', { profile: null })
    }

    return success(res, 200, 'Perfil encontrado', { profile })
  } catch (error) {
    return failure(res, 500, 'No fue posible obtener el perfil', {
      profile: null,
    })
  }
}

const createProfile = async (req, res) => {
  try {
    const profileCreate = await Profile.create(withCreateAudit(pickAllowedFields(req.body, PROFILE_FIELDS), req.auth))
    return success(res, 201, 'Perfil creado con exito', {
      profile: profileCreate,
    })
  } catch (error) {
    return handleRequestError({
      context: 'profiles.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear el perfil: ',
      payloadKey: 'profile',
    })
  }
}

const updateProfile = async (req, res) => {
  const { id } = req.params
  try {
    const profileUpdate = await Profile.update(withUpdateAudit(pickAllowedFields(req.body, PROFILE_FIELDS), req.auth), {
      where: {
        id: id,
      },
    })

    if (profileUpdate[0] === 0) {
      return failure(res, 404, 'Perfil no encontrado o no se realizaron cambios', { profile: null })
    }

    const updatedProfile = await Profile.findByPk(id)

    return success(res, 200, 'Perfil actualizado con exito', {
      profile: updatedProfile,
    })
  } catch (error) {
    return handleRequestError({
      context: 'profiles.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar el perfil: ',
      payloadKey: 'profile',
    })
  }
}

const destroyProfile = async (req, res) => {
  try {
    const { id } = req.params
    const profile = await Profile.findByPk(id)
    if (!profile) {
      return failure(res, 404, 'Perfil no encontrado', { profile: null })
    }
    await profile.destroy()
    return success(res, 200, 'Perfil eliminado con exito', {
      profile,
    })
  } catch (error) {
    return failure(res, 500, 'No fue posible eliminar el perfil', {
      profile: null,
    })
  }
}

module.exports = {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  destroyProfile,
}
