const cors = require('cors')

const { buildHttpError } = require('../utils/requestError')

const parseAllowedOrigins = () =>
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

const buildCorsMiddleware = () => {
  const allowedOrigins = parseAllowedOrigins()

  return cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(buildHttpError(403, 'Origen no permitido por CORS'))
    },
  })
}

module.exports = {
  buildCorsMiddleware,
  parseAllowedOrigins,
}
