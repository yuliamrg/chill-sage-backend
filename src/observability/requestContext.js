const crypto = require('crypto')
const { buildRequestLogContext, logInfo } = require('./logger')

const REQUEST_ID_HEADER = 'X-Request-Id'

const buildRequestId = (incomingRequestId) => {
  if (typeof incomingRequestId === 'string' && incomingRequestId.trim()) {
    return incomingRequestId.trim().slice(0, 120)
  }

  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return crypto.randomBytes(16).toString('hex')
}

const attachRequestContext = (req, res, next) => {
  req.requestId = buildRequestId(req.get(REQUEST_ID_HEADER) || req.get('x-request-id'))
  res.setHeader(REQUEST_ID_HEADER, req.requestId)

  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6

    logInfo('http.request.completed', {
      ...buildRequestLogContext(req),
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    })
  })

  next()
}

module.exports = {
  REQUEST_ID_HEADER,
  attachRequestContext,
}
