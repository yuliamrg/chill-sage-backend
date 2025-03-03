const Request = require('../../models/Requests/Request.model')
const { Op } = require('sequelize')

const getRequests = async (req, res) => {
  try {
    const requests = await Request.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obeniendo equipos',
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
      msg: 'equipo creado con exito',
      request: requestCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el equipo: ' + error.message,
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
    res.status(201).json({
      status: true,
      msg: 'equipo actualizado con exito',
      request: requestUpdate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el equipo: ' + error.message,
      request: [],
    })
  }
}

const destroyRequest = async (req, res) => {
  try {
    const { id } = req.params
    const request = await request.findByPk(id)
    if (!request) {
      return res.status(404).json({
        status: false,
        msg: 'equipo no encontrado',
        request: [],
      })
    }
    await request.destroy()
    res.status(200).json({
      status: true,
      msg: 'equipo eliminado con exito',
      request: request,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el equipo: ' + error.message,
      request: [],
    })
  }
}

module.exports = {
  getRequests,
  createRequest,
  updateRequest,
  destroyRequest,
}
