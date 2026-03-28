const Client = require('../../models/Clients/Client.model')
const Equipment = require('../../models/Equipments/Equipment.model')
const Order = require('../../models/Orders/Order.model')
const Request = require('../../models/Requests/request.model')
const Schedule = require('../../models/Schedules/Schedule.model')
const User = require('../../models/Users/User.model')
const {
  assertClientDeleteAllowed,
  assertClientRequiredFields,
  assertClientUpdateAllowed,
  buildClientPayload,
  validateClientPayload,
} = require('../../domain/operations/clientPolicy')
const { DomainError, buildDomainErrorResponse } = require('../../domain/shared/domainError')
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
    const payload = buildClientPayload(pickAllowedFields(req.body, CLIENT_FIELDS))

    assertClientRequiredFields(payload)
    validateClientPayload(payload)

    const clientCreate = await Client.create(withCreateAudit(payload, req.auth))
    return success(res, 201, 'Cliente creado con exito', {
      client: clientCreate,
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'client')
    }

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
    const client = await Client.findByPk(id)

    if (!client) {
      return failure(res, 404, 'Cliente no encontrado', { client: null })
    }

    const payload = buildClientPayload(pickAllowedFields(req.body, CLIENT_FIELDS))
    const nextPayload = {
      ...client.toJSON(),
      ...payload,
    }

    assertClientRequiredFields(nextPayload)
    validateClientPayload(nextPayload)
    assertClientUpdateAllowed({ client, payload, roleName: req.auth?.roleName })

    await client.update(withUpdateAudit(payload, req.auth))

    return success(res, 200, 'Cliente actualizado con exito', {
      client,
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'client')
    }

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

    const [users, equipments, requests, orders, schedules] = await Promise.all([
      User.count({ where: { client: client.id } }),
      Equipment.count({ where: { client: client.id } }),
      Request.count({ where: { client_id: client.id } }),
      Order.count({ where: { client_id: client.id } }),
      Schedule.count({ where: { client_id: client.id } }),
    ])

    assertClientDeleteAllowed({ users, equipments, requests, orders, schedules })

    await client.destroy()
    return success(res, 200, 'Cliente eliminado con exito', {
      client,
    })
  } catch (error) {
    if (error instanceof DomainError) {
      return buildDomainErrorResponse(res, error, 'client')
    }

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
