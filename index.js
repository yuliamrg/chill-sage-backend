require('dotenv').config()

const cors = require('cors') //cors para permitir peticiones desde otros dominios
const db = require('./models/database/dbconneciont') //conectar a la base de datos
const routes = require('./routes/api.routes')
const express = require('express')
const app = express() //crear una app de express

// middlewares
app.use(express.json())
app.use('/api', routes)
app.use(cors()) //cors

//conectarse a la base de datos
db.sync({ force: false })
  .then(() => {
    console.log('Database connected!')
  })
  .catch((error) => {
    console.log('Database connection error:', error)
  })

// Servidor
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
