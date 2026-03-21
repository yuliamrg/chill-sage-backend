const Order = require('../../models/Orders/Order.model')
const User = require('../../models/Users/User.model')
const Request = require('../../models/Requests/request.model')
const { success, failure } = require('../../utils/apiResponse')
const { handleRequestError } = require('../../utils/requestError')

const enrichOrder = async (order) => {
  if (!order) {
    return null
  }

  const orderData = typeof order.toJSON === 'function' ? order.toJSON() : order
  const [assignedUser, request] = await Promise.all([
    orderData.user_assigned_id ? User.findByPk(orderData.user_assigned_id) : null,
    orderData.request_id ? Request.findByPk(orderData.request_id) : null,
  ])

  return {
    ...orderData,
    assigned_user_name: assignedUser ? [assignedUser.name, assignedUser.last_name].filter(Boolean).join(' ') : null,
    request_summary: request?.description ?? null,
  }
}

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll()
    const hydratedOrders = await Promise.all(orders.map(enrichOrder))
    return success(res, 200, 'Obteniendo ordenes', {
      orders: hydratedOrders,
    })
  } catch (error) {
    return failure(res, 500, 'Error al conectar con el controlador order:' + error.message, {
      orders: [],
    })
  }
}

const createOrder = async (req, res) => {
  try {
    const orderCreate = await Order.create(req.body)
    return success(res, 201, 'Orden creada con exito', {
      order: await enrichOrder(orderCreate),
    })
  } catch (error) {
    return handleRequestError({
      context: 'orders.create',
      req,
      res,
      error,
      fallbackMessage: 'Error al crear la orden: ',
      payloadKey: 'order',
    })
  }
}

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findByPk(id)

    if (!order) {
      return failure(res, 404, 'Orden no encontrada', { order: null })
    }

    return success(res, 200, 'Orden encontrada', {
      order: await enrichOrder(order),
    })
  } catch (error) {
    return failure(res, 500, 'Error al obtener la orden: ' + error.message, {
      order: null,
    })
  }
}

const updateOrder = async (req, res) => {
  const { id } = req.params
  try {
    const orderUpdate = await Order.update(req.body, {
      where: {
        id: id,
      },
    })

    if (orderUpdate[0] === 0) {
      return failure(res, 404, 'Orden no encontrada o no se realizaron cambios', { order: null })
    }

    const updatedOrder = await Order.findByPk(id)

    return success(res, 200, 'Orden actualizada con exito', {
      order: await enrichOrder(updatedOrder),
    })
  } catch (error) {
    return handleRequestError({
      context: 'orders.update',
      req,
      res,
      error,
      fallbackMessage: 'Error al actualizar la orden: ',
      payloadKey: 'order',
    })
  }
}

const destroyOrder = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findByPk(id)
    if (!order) {
      return failure(res, 404, 'Orden no encontrada', { order: null })
    }
    await order.destroy()
    return success(res, 200, 'Orden eliminada con exito', {
      order: await enrichOrder(order),
    })
  } catch (error) {
    return failure(res, 500, 'Error al eliminar la orden: ' + error.message, {
      order: null,
    })
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  destroyOrder,
}
