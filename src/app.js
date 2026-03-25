require('dotenv').config()

const cors = require('cors')
const express = require('express')

const db = require('./models/database/dbconnection')
const { initializeModelAssociations } = require('./models')
const routes = require('./routes/api.routes')
const { ensureJwtConfig } = require('./auth/jwt')
const { failure } = require('./utils/apiResponse')
const { logRequestError } = require('./utils/requestError')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', routes)

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logRequestError('http.invalid-json', req, err)
    return failure(res, 400, 'Invalid JSON format', {
      details: err.message,
      position: err.message.match(/position (\d+)/)?.[1] || 'unknown',
    })
  }

  return next(err)
})

app.use((err, req, res, next) => {
  logRequestError('http.unhandled', req, err)
  return failure(res, err?.status || 500, err?.message || 'Unexpected server error', {})
})

let initializationPromise = null

const initializeApp = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await db.authenticate()
      initializeModelAssociations()
      ensureJwtConfig()

      return app
    })().catch((error) => {
      initializationPromise = null
      throw error
    })
  }

  return initializationPromise
}

const startServer = async (port = process.env.PORT || 3000) => {
  await initializeApp()

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log('Database connected!')
      console.log(`Server running on port ${port}`)
      resolve(server)
    })
  })
}

module.exports = {
  app,
  initializeApp,
  startServer,
}
