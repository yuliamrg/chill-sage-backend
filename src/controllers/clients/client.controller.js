const Client = require('../../models/Clients/Client.model')
const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo clientes',
      clients: clients,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador client:' + error.message,
      clients: [],
    })
  }
}

const createClient = async (req, res) => {
  try {
    const clientCreate = await Client.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'Cliente creado con exito',
      client: clientCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el cliente: ' + error.message,
      client: [],
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
      return res.status(404).json({
        status: false,
        msg: 'Cliente no encontrado o no se realizaron cambios',
        client: [],
      })
    }

    const updatedClient = await Client.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Cliente actualizado con exito',
      client: updatedClient,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el cliente: ' + error.message,
      client: [],
    })
  }
}

const destroyClient = async (req, res) => {
  try {
    const { id } = req.params
    const client = await Client.findByPk(id)
    if (!client) {
      return res.status(404).json({
        status: false,
        msg: 'Cliente no encontrado',
        client: [],
      })
    }
    await client.destroy()
    res.status(200).json({
      status: true,
      msg: 'Cliente eliminado con exito',
      client: client,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el cliente: ' + error.message,
      client: [],
    })
  }
}

module.exports = {
  getClients,
  createClient,
  updateClient,
  destroyClient,
}
