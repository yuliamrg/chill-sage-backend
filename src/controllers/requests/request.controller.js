const Request = require('../../models/Requests/request.model')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const REQUEST_FIELDS = ['description', 'status']
const getRequests = async (req, res) => {
  try {
    const requests = await Request.findAll()
    return success(res, 200, 'Obteniendo solicitudes', {
      requests: requests,
    })
  } catch (error) {
    return failure(res, 500, 'Error al conectar con el controlador request:' + error.message, {
      requests: [],
    })
  }
}

const createRequest = async (req, res) => {
  try {
    const requestPayload = pickAllowedFields(req.body, REQUEST_FIELDS)

    if (!requestPayload.status) {
      requestPayload.status = 'pending'
    }

    const requestCreate = await Request.create(withCreateAudit(requestPayload, req.auth))
    return success(res, 201, 'Solicitud creada con exito', {
      request: requestCreate,
    })
  } catch (error) {
    return handleRequestError({
      context: 'requests.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear la solicitud: ',
      payloadKey: 'request',
    })
  }
}

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params
    const request = await Request.findByPk(id)

    if (!request) {
      return failure(res, 404, 'Solicitud no encontrada', { request: null })
    }

    return success(res, 200, 'Solicitud encontrada', {
      request,
    })
  } catch (error) {
    return failure(res, 500, 'Error al obtener la solicitud: ' + error.message, {
      request: null,
    })
  }
}

const updateRequest = async (req, res) => {
  const { id } = req.params
  try {
    const requestUpdate = await Request.update(withUpdateAudit(pickAllowedFields(req.body, REQUEST_FIELDS), req.auth), {
      where: {
        id: id,
      },
    })

    if (requestUpdate[0] === 0) {
      return failure(res, 404, 'Solicitud no encontrada o no se realizaron cambios', { request: null })
    }

    const updatedRequest = await Request.findByPk(id)

    return success(res, 200, 'Solicitud actualizada con exito', {
      request: updatedRequest,
    })
  } catch (error) {
    return handleRequestError({
      context: 'requests.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar la solicitud: ',
      payloadKey: 'request',
    })
  }
}

const destroyRequest = async (req, res) => {
  try {
    const { id } = req.params
    const request = await Request.findByPk(id)
    if (!request) {
      return failure(res, 404, 'Solicitud no encontrada', { request: null })
    }
    await request.destroy()
    return success(res, 200, 'Solicitud eliminada con exito', {
      request,
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar la solicitud: ' + error.message, {
      request: null,
    })
  }
}

module.exports = {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  destroyRequest,
}
