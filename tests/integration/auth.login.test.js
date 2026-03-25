const bcrypt = require('bcrypt')
const request = require('supertest')

const User = require('../../src/models/Users/User.model')
const { ROLE_IDS } = require('../../src/auth/roles')
const { app, getFallbackPassword, initializeApp, login } = require('../helpers/auth')

describe('POST /api/users/login', () => {
  const inactiveUser = {
    username: 'inactive_test_jest',
    email: 'inactive_test_jest@example.com',
    password: 'Test1234!',
  }

  beforeAll(async () => {
    await initializeApp()

    await User.destroy({
      where: {
        username: inactiveUser.username,
      },
    })

    await User.create({
      username: inactiveUser.username,
      name: 'Inactive',
      last_name: 'Test',
      email: inactiveUser.email,
      password: await bcrypt.hash(inactiveUser.password, 10),
      client: null,
      role: ROLE_IDS.SOLICITANTE,
      status: 'inactive',
    })
  })

  afterAll(async () => {
    await User.destroy({
      where: {
        username: inactiveUser.username,
      },
    })
  })

  test('returns token when logging in with email', async () => {
    const response = await login({
      email: process.env.TEST_ADMIN_EMAIL,
    })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe(true)
    expect(response.body.token_type).toBe('Bearer')
    expect(response.body.access_token).toEqual(expect.any(String))
    expect(response.body.user.email).toBe(process.env.TEST_ADMIN_EMAIL)
  })

  test('returns token when logging in with username', async () => {
    const response = await login({
      username: process.env.TEST_ADMIN_USERNAME,
    })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe(true)
    expect(response.body.access_token).toEqual(expect.any(String))
    expect(response.body.user.username).toBe(process.env.TEST_ADMIN_USERNAME)
  })

  test('rejects missing identifier', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        password: getFallbackPassword(),
      })

    expect(response.status).toBe(400)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/Debes enviar email o username/i)
  })

  test('rejects nonexistent user', async () => {
    const response = await login({
      email: 'missing-user@example.com',
    })

    expect(response.status).toBe(401)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/Usuario no encontrado/i)
  })

  test('rejects wrong password', async () => {
    const response = await login({
      email: process.env.TEST_ADMIN_EMAIL,
      password: 'WrongPassword!123',
    })

    expect(response.status).toBe(401)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/Contrasena incorrecta/i)
  })

  test('rejects inactive user', async () => {
    const response = await login({
      email: inactiveUser.email,
      password: inactiveUser.password,
    })

    expect(response.status).toBe(401)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/Usuario inactivo/i)
  })
})
