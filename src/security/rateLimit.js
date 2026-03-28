const rateLimit = require('express-rate-limit')

const { failure } = require('../utils/apiResponse')

const parsePositiveInt = (value, fallbackValue) => {
  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallbackValue
  }

  return parsed
}

const buildLoginRateLimiter = () =>
  rateLimit({
    windowMs: parsePositiveInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    limit: parsePositiveInt(process.env.LOGIN_RATE_LIMIT_MAX, 5),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler(req, res) {
      return failure(res, 429, 'Demasiados intentos de inicio de sesion. Intenta nuevamente mas tarde', {
        user: null,
      })
    },
  })

module.exports = {
  buildLoginRateLimiter,
}
