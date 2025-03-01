
const Brand = require('../../../models/parameters/brands/brand.model')

const index = async (req, res) => {
  
  return res.status(200).json({ 
    status: true,
    msg: 'Conectado con esxito al controlador de marcas',
    brands: []
  })
}

const create = async (req, res) => {

  const brandCreate = await Brand.create(req.body)
  Brand.destroy({ where: { id: brandCreate.id } })
  Brand.findOne({ where: {
    [Op.or]: [
      { code:code },
      { name:name }
    ]
  }})
  return res.status(201).json({
    status: true,
    msg: 'marca creada con exito',
    brand: brandCreate
  })
}

const update = async (req, res) => {
  return res.status(201).json({
    status: true,
    msg: 'Conectado al conrolador de marcas funcion de update',
    brand: []
  })
}

const destroy = async (req, res) => {
  return res.status(201).json({
    status: true,
    msg: 'Conectado al conrolador de marcas funcion de destroy',
    brand: []
  })
}

module.exports = {
  index,
  create,
  update,
  destroy
}