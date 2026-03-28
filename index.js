require('dotenv').config()

const { startServer } = require('./src/app')
const { logError } = require('./src/observability/logger')

startServer().catch((error) => {
  logError('app.server.startup-failed', {
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    },
  })
  process.exit(1)
})
