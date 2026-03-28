const Client = require('../../models/Clients/Client.model')
const { success, failure } = require('../../utils/apiResponse')
const { PaginationQueryError, buildPaginationMeta, parsePaginationQuery } = require('../../utils/pagination')
const { handleRequestError } = require('../../utils/requestError')
const { pickAllowedFields, withCreateAudit, withUpdateAudit } = require('../../utils/payload')

const CLIENT_FIELDS = ['name', 'address', 'phone', 'email', 'description', 'status']
const getClients = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query, {
      allowedSortFields: ['id', 'name', 'email', 'status', 'created_at', 'updated_at'],
      defaultSort: { field: 'created_at', direction: 'DESC' },
    })
    const { count, rows } = await Client.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: pagination.order,
    })

    return success(res, 200, 'Obteniendo clientes', {
      clients: rows,
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
      return failure(res, 400, error.message, { clients: [], meta: null })
    }

    return failure(res, 500, 'No fue posible obtener clientes', {
      clients: [],
      meta: null,
    })
  }
}

const createClient = async (req, res) => {
  try {
    const clientCreate = await Client.create(withCreateAudit(pickAllowedFields(req.body, CLIENT_FIELDS), req.auth))
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
    return failure(res, 500, 'No fue posible obtener el cliente', {
      client: null,
    })
  }
}

const updateClient = async (req, res) => {
  const { id } = req.params
  try {
    const clientUpdate = await Client.update(withUpdateAudit(pickAllowedFields(req.body, CLIENT_FIELDS), req.auth), {
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
    return failure(res, 500, 'No fue posible eliminar el cliente', {
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
