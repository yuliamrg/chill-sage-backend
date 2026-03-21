const success = (res, statusCode, msg, payload = {}) =>
  res.status(statusCode).json({
    status: true,
    msg,
    ...payload,
  })

const failure = (res, statusCode, msg, payload = {}) =>
  res.status(statusCode).json({
    status: false,
    msg,
    ...payload,
  })

module.exports = {
  success,
  failure,
}
