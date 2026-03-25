const request = require('supertest')

const { app, initializeApp } = require('../../src/app')

const credentialMap = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL,
    username: process.env.TEST_ADMIN_USERNAME,
    password: process.env.TEST_LOGIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD,
  },
  planeador: {
    email: process.env.TEST_PLANEADOR_EMAIL,
    username: process.env.TEST_PLANEADOR_USERNAME,
    password: process.env.TEST_LOGIN_PASSWORD || process.env.TEST_PLANEADOR_PASSWORD,
  },
  tecnico: {
    email: process.env.TEST_TECNICO_EMAIL,
    username: process.env.TEST_TECNICO_USERNAME,
    password: process.env.TEST_LOGIN_PASSWORD || process.env.TEST_TECNICO_PASSWORD,
  },
  solicitante: {
    email: process.env.TEST_SOLICITANTE_EMAIL,
    username: process.env.TEST_SOLICITANTE_USERNAME,
    password: process.env.TEST_LOGIN_PASSWORD || process.env.TEST_SOLICITANTE_PASSWORD,
  },
}

const getFallbackPassword = () =>
  process.env.TEST_LOGIN_PASSWORD ||
  process.env.TEST_ADMIN_PASSWORD ||
  process.env.TEST_PLANEADOR_PASSWORD ||
  process.env.TEST_TECNICO_PASSWORD ||
  process.env.TEST_SOLICITANTE_PASSWORD

const ensureTestCredentials = (role) => {
  const credentials = credentialMap[role]

  if (!credentials?.email || !credentials?.password) {
    throw new Error(`Missing TEST_* credentials for role "${role}" in .env`)
  }

  return credentials
}

const login = async ({ email, username, password = getFallbackPassword() }) => {
  await initializeApp()

  return request(app)
    .post('/api/users/login')
    .send({
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      password,
    })
}

const loginAsRole = async (role) => {
  const credentials = ensureTestCredentials(role)

  const response = await login({
    email: credentials.email,
    password: credentials.password,
  })

  if (response.status !== 200) {
    throw new Error(`Login failed for role "${role}" with email: ${response.status} ${response.body?.msg || ''}`)
  }

  return response
}

const getAuthHeader = async (role) => {
  const response = await loginAsRole(role)
  return `Bearer ${response.body.access_token}`
}

module.exports = {
  app,
  getFallbackPassword,
  initializeApp,
  login,
  loginAsRole,
  getAuthHeader,
}
