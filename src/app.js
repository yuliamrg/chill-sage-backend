require('dotenv').config()

const express = require('express')

const db = require('./models/database/dbconnection')
const { initializeModelAssociations } = require('./models')
const routes = require('./routes/api.routes')
const { ensureJwtConfig } = require('./auth/jwt')
const { buildCorsMiddleware, parseAllowedOrigins } = require('./security/cors')
const { failure } = require('./utils/apiResponse')
const { logRequestError } = require('./utils/requestError')
const { logInfo, logWarn } = require('./observability/logger')
const { attachRequestContext } = require('./observability/requestContext')

const app = express()

app.use(buildCorsMiddleware())
app.use(attachRequestContext)
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

  if (err?.status && err.status < 500) {
    return failure(res, err.status, err.message, {})
  }

  return failure(res, 500, 'Unexpected server error', {})
})

let initializationPromise = null

const initializeApp = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await db.authenticate()
      initializeModelAssociations()
      ensureJwtConfig()

      if (parseAllowedOrigins().length === 0) {
        logWarn('app.cors.empty-origins', {
          message: 'CORS_ORIGINS is empty. Browser requests with Origin header will be rejected.',
        })
      }

      logInfo('app.initialized', {
        nodeEnv: process.env.NODE_ENV || 'development',
      })

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
      logInfo('app.server.started', {
        port,
      })
      resolve(server)
    })
  })
}

module.exports = {
  app,
  initializeApp,
  startServer,
}
