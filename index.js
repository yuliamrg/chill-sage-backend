// console.log("hola mundo desde node");

require('dotenv').config()
const cors = require('cors') //cors para permitir peticiones desde otros dominios

const sequelize = require('./models/database/dbconneciont') //conectar a la base de datos
const routes = require('./routes/api.routes')
const express = require('express')
const app = express() //crear una app de express

const port = process.env.PORT || 3000

app.use('/api', routes)

app.use(cors()) //cors
app.listen(port, () => {
  console.log('My app en node en el puerto ' + port)

  //conectarse a la base de datos
  sequelize
    .sync({ force: false })
    .then(() => {
      console.log('conectado a la db')
    })
    .catch((error) => {
      console.log('Ha habido un error en la conexion: ', +error)
    })
})
