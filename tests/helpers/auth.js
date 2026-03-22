const request = require('supertest')

const { app, initializeApp } = require('../../src/app')

const credentialMap = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL,
    username: process.env.TEST_ADMIN_USERNAME,
  },
  planeador: {
    email: process.env.TEST_PLANEADOR_EMAIL,
    username: process.env.TEST_PLANEADOR_USERNAME,
  },
  tecnico: {
    email: process.env.TEST_TECNICO_EMAIL,
    username: process.env.TEST_TECNICO_USERNAME,
  },
  solicitante: {
    email: process.env.TEST_SOLICITANTE_EMAIL,
    username: process.env.TEST_SOLICITANTE_USERNAME,
  },
}

const getPassword = () => process.env.TEST_LOGIN_PASSWORD

const ensureTestCredentials = (role) => {
  const credentials = credentialMap[role]

  if (!credentials?.email || !credentials?.username || !getPassword()) {
    throw new Error(`Missing TEST_* credentials for role "${role}" in .env`)
  }

  return credentials
}

const login = async ({ email, username, password = getPassword() }) => {
  await initializeApp()

  return request(app)
    .post('/api/users/login')
    .send({
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      password,
    })
}

const loginAsRole = async (role, identifier = 'email') => {
  const credentials = ensureTestCredentials(role)

  const response = await login({
    [identifier]: credentials[identifier],
  })

  if (response.status !== 200) {
    throw new Error(`Login failed for role "${role}" with ${identifier}: ${response.status} ${response.body?.msg || ''}`)
  }

  return response
}

const getAuthHeader = async (role, identifier = 'email') => {
  const response = await loginAsRole(role, identifier)
  return `Bearer ${response.body.access_token}`
}

module.exports = {
  app,
  initializeApp,
  login,
  loginAsRole,
  getAuthHeader,
}
