const { failure } = require('./apiResponse')
const { buildRequestLogContext, logError, serializeError } = require('../observability/logger')

const getValidationDetails = (error) => {
  if (!Array.isArray(error?.errors)) {
    return []
  }

  return error.errors
    .map((item) => item?.message)
    .filter(Boolean)
}

const normalizeError = (error, fallbackMessage) => {
  const details = getValidationDetails(error)
  const safeFallbackMessage =
    typeof fallbackMessage === 'string' && fallbackMessage.trim()
      ? fallbackMessage.replace(/[:\s]+$/, '').trim()
      : 'No fue posible procesar la solicitud'

  switch (error?.name) {
    case 'SequelizeUniqueConstraintError':
      return {
        statusCode: 409,
        msg: details[0] ?? 'El registro ya existe o viola una restriccion unica.',
        details,
      }
    case 'SequelizeValidationError':
      return {
        statusCode: 400,
        msg: details[0] ?? 'Los datos enviados no son validos.',
        details,
      }
    case 'SequelizeForeignKeyConstraintError':
      return {
        statusCode: 400,
        msg: 'La relacion enviada no es valida o no existe.',
        details,
      }
    default:
      return {
        statusCode: 500,
        msg: safeFallbackMessage,
        details,
      }
  }
}

const buildHttpError = (status, message) => {
  const error = new Error(message)
  error.status = status
  return error
}

const logRequestError = (context, req, error) => {
  logError(context, {
    ...buildRequestLogContext(req),
    params: req?.params,
    query: req?.query,
    body: req?.body,
    validationErrors: getValidationDetails(error),
    error: serializeError(error),
  })
}

const handleRequestError = ({ context, req, res, error, fallbackMessage, payloadKey }) => {
  logRequestError(context, req, error)

  const normalized = normalizeError(error, fallbackMessage)

  return failure(res, normalized.statusCode, normalized.msg, {
    [payloadKey]: null,
    ...(normalized.details.length ? { details: normalized.details } : {}),
  })
}

module.exports = {
  buildHttpError,
  handleRequestError,
  logRequestError,
}
