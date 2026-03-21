const Client = require('../../models/Clients/Client.model')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')
const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll()
    return success(res, 200, 'Obteniendo clientes', {
      clients: clients,
    })
  } catch (error) {
    return failure(res, 500, 'Error al conectar con el controlador client:' + error.message, {
      clients: [],
    })
  }
}

const createClient = async (req, res) => {
  try {
    const clientCreate = await Client.create(req.body)
    return success(res, 201, 'Cliente creado con exito', {
      client: clientCreate,
    })
  } catch (error) {
    return handleRequestError({
      context: 'clients.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear el cliente: ',
      payloadKey: 'client',
    })
  }
}

const getClientById = async (req, res) => {
  try {
    const { id } = req.params
    const client = await Client.findByPk(id)

    if (!client) {
      return failure(res, 404, 'Cliente no encontrado', { client: null })
    }

    return success(res, 200, 'Cliente encontrado', {
      client,
    })
  } catch (error) {
    return failure(res, 500, 'Error al obtener el cliente: ' + error.message, {
      client: null,
    })
  }
}

const updateClient = async (req, res) => {
  const { id } = req.params
  try {
    const clientUpdate = await Client.update(req.body, {
      where: {
        id: id,
      },
    })

    if (clientUpdate[0] === 0) {
      return failure(res, 404, 'Cliente no encontrado o no se realizaron cambios', { client: null })
    }

    const updatedClient = await Client.findByPk(id)

    return success(res, 200, 'Cliente actualizado con exito', {
      client: updatedClient,
    })
  } catch (error) {
    return handleRequestError({
      context: 'clients.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar el cliente: ',
      payloadKey: 'client',
    })
  }
}

const destroyClient = async (req, res) => {
  try {
    const { id } = req.params
    const client = await Client.findByPk(id)
    if (!client) {
      return failure(res, 404, 'Cliente no encontrado', { client: null })
    }
    await client.destroy()
    return success(res, 200, 'Cliente eliminado con exito', {
      client,
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar el cliente: ' + error.message, {
      client: null,
    })
  }
}

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  destroyClient,
}
