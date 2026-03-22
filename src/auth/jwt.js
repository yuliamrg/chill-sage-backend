const jwt = require('jsonwebtoken')

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable')
  }

  return process.env.JWT_SECRET
}

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '8h'

const ensureJwtConfig = () => ({
  secret: getJwtSecret(),
  expiresIn: getJwtExpiresIn(),
})

const signAccessToken = ({ userId, roleId, roleName }) =>
  jwt.sign(
    {
      sub: String(userId),
      roleId,
      roleName,
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn(),
    }
  )

const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret())

module.exports = {
  ensureJwtConfig,
  getJwtExpiresIn,
  signAccessToken,
  verifyAccessToken,
}
