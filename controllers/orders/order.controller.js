const Order = require('../../models/Orders/Order.model')
const { Op } = require('sequelize')

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obeniendo ordenes',
      orders: orders,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al conectar con el controlador order:' + error.message,
      orders: [],
    })
  }
}

const createOrder = async (req, res) => {
  try {
    const orderCreate = await Order.create(req.body)
    res.status(201).json({
      status: true,
      msg: 'orden creado con exito',
      order: orderCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear el orden: ' + error.message,
      order: [],
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
    res.status(201).json({
      status: true,
      msg: 'orden actualizado con exito',
      order: orderUpdate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar el orden: ' + error.message,
      order: [],
    })
  }
}

const destroyOrder = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findByPk(id)
    if (!order) {
      return res.status(404).json({
        status: false,
        msg: 'orden no encontrado',
        order: [],
      })
    }
    await order.destroy()
    res.status(200).json({
      status: true,
      msg: 'orden eliminado con exito',
      order: order,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar el orden: ' + error.message,
      order: [],
    })
  }
}

module.exports = {
  getOrders,
  createOrder,
  updateOrder,
  destroyOrder,
}
