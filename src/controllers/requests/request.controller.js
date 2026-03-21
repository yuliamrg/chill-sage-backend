const Request = require('../../models/Requests/request.model')
const getRequests = async (req, res) => {
  try {
    const requests = await Request.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo solicitudes',
      requests: requests,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador request:' + error.message,
      requests: [],
    })
  }
}

const createRequest = async (req, res) => {
  try {
    const requestCreate = await Request.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'Solicitud creada con exito',
      request: requestCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear la solicitud: ' + error.message,
      request: [],
    })
  }
}

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params
    const request = await Request.findByPk(id)

    if (!request) {
      return res.status(404).json({
        status: false,
        msg: 'Solicitud no encontrada',
        request: [],
      })
    }

    res.status(200).json({
      status: true,
      msg: 'Solicitud encontrada',
      request,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al obtener la solicitud: ' + error.message,
      request: [],
    })
  }
}

const updateRequest = async (req, res) => {
  const { id } = req.params
  try {
    const requestUpdate = await Request.update(req.body, {
      where: {
        id: id,
      },
    })

    if (requestUpdate[0] === 0) {
      return res.status(404).json({
        status: false,
        msg: 'Solicitud no encontrada o no se realizaron cambios',
        request: [],
      })
    }

    const updatedRequest = await Request.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Solicitud actualizada con exito',
      request: updatedRequest,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar la solicitud: ' + error.message,
      request: [],
    })
  }
}

const destroyRequest = async (req, res) => {
  try {
    const { id } = req.params
    const request = await Request.findByPk(id)
    if (!request) {
      return res.status(404).json({
        status: false,
        msg: 'Solicitud no encontrada',
        request: [],
      })
    }
    await request.destroy()
    res.status(200).json({
      status: true,
      msg: 'Solicitud eliminada con exito',
      request: request,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar la solicitud: ' + error.message,
      request: [],
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
