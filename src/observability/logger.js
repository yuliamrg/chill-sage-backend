const SENSITIVE_KEYS = new Set(['authorization', 'password', 'access_token', 'refresh_token', 'token'])

const getTimestamp = () => new Date().toISOString()

const sanitizeValue = (value, key = '') => {
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
    return '[redacted]'
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [childKey, childValue]) => {
      acc[childKey] = sanitizeValue(childValue, childKey)
      return acc
    }, {})
  }

  return value
}

const serializeError = (error) => {
  if (!error) {
    return undefined
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  }
}

const writeLog = (level, event, data = {}) => {
  const entry = {
    timestamp: getTimestamp(),
    level,
    service: process.env.APP_NAME || 'chillsage-backend',
    event,
    ...sanitizeValue(data),
  }

  const line = JSON.stringify(entry)

  if (level === 'error') {
    console.error(line)
    return
  }

  console.log(line)
}

const logInfo = (event, data) => writeLog('info', event, data)
const logWarn = (event, data) => writeLog('warn', event, data)
const logError = (event, data) => writeLog('error', event, data)

const buildRequestLogContext = (req) => ({
  requestId: req?.requestId,
  method: req?.method,
  path: req?.originalUrl,
  ip: req?.ip,
  userAgent: req?.get?.('user-agent'),
  auth: req?.auth
    ? {
        userId: req.auth.userId,
        roleId: req.auth.roleId,
        roleName: req.auth.roleName,
      }
    : undefined,
})

module.exports = {
  buildRequestLogContext,
  logInfo,
  logWarn,
  logError,
  serializeError,
}
