require('dotenv').config()

const cors = require('cors') //cors para permitir peticiones desde otros dominios
const db = require('./src/models/database/dbconnection') //conectar a la base de datos
const routes = require('./src/routes/api.routes')
const express = require('express')
const app = express() //crear una app de express

// middlewares
app.use(cors()) //cors
app.use(express.json())
app.use('/api', routes)

// Custom error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: 'Invalid JSON format', 
      details: err.message,
      position: err.message.match(/position (\d+)/)?.[1] || 'unknown'
    });
  }
  next(err);
});

const port = process.env.PORT || 3000

const startServer = async () => {
  try {
    await db.authenticate()

    if (process.env.DB_SYNC === 'true') {
      await db.sync({ force: false })
    }

    console.log('Database connected!')

    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

startServer()
