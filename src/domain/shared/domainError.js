const { failure } = require('../../utils/apiResponse')

class DomainError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'DomainError'
    this.statusCode = statusCode
  }
}

const buildDomainErrorResponse = (res, error, payloadKey) =>
  failure(res, error.statusCode || 400, error.message, { [payloadKey]: null })

module.exports = {
  DomainError,
  buildDomainErrorResponse,
}
