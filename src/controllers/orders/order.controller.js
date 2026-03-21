const Order = require('../../models/Orders/Order.model')

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll()
    res.status(200).json({
      status: true,
      msg: 'Obteniendo ordenes',
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
      msg: 'Orden creada con exito',
      order: orderCreate,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al crear la orden: ' + error.message,
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

    if (orderUpdate[0] === 0) {
      return res.status(404).json({
        status: false,
        msg: 'Orden no encontrada o no se realizaron cambios',
        order: [],
      })
    }

    const updatedOrder = await Order.findByPk(id)

    res.status(200).json({
      status: true,
      msg: 'Orden actualizada con exito',
      order: updatedOrder,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al actualizar la orden: ' + error.message,
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
        msg: 'Orden no encontrada',
        order: [],
      })
    }
    await order.destroy()
    res.status(200).json({
      status: true,
      msg: 'Orden eliminada con exito',
      order: order,
    })
  } catch (error) {
    res.status(500).json({
      status: false,
      msg: 'Error al eliminar la orden: ' + error.message,
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
