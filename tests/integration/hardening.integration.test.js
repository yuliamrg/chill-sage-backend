const request = require('supertest')

const { app, initializeApp } = require('../helpers/auth')
const { parseAllowedOrigins } = require('../../src/security/cors')

const loadIsolatedApp = async ({ envOverrides = {}, routeFactory } = {}) => {
  const originalEnv = {
    LOGIN_RATE_LIMIT_MAX: process.env.LOGIN_RATE_LIMIT_MAX,
    LOGIN_RATE_LIMIT_WINDOW_MS: process.env.LOGIN_RATE_LIMIT_WINDOW_MS,
  }

  Object.assign(process.env, envOverrides)
  jest.resetModules()

  if (routeFactory) {
    jest.doMock('../../src/routes/api.routes', () => routeFactory())
  }

  const isolatedAppModule = require('../../src/app')
  const isolatedDb = require('../../src/models/database/dbconnection')

  await isolatedAppModule.initializeApp()

  const cleanup = async () => {
    await isolatedDb.close().catch(() => {})
    jest.dontMock('../../src/routes/api.routes')

    Object.entries(originalEnv).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
        delete process.env[key]
        return
      }

      process.env[key] = value
    })

    jest.resetModules()
  }

  return {
    app: isolatedAppModule.app,
    cleanup,
  }
}

describe('hardening regressions', () => {
  beforeAll(async () => {
    await initializeApp()
  })

  test('allows configured CORS origins and echoes the allowed origin header', async () => {
    const allowedOrigin = parseAllowedOrigins()[0]

    expect(allowedOrigin).toEqual(expect.any(String))

    const response = await request(app)
      .get('/api/health')
      .set('Origin', allowedOrigin)

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin)
  })

  test('rejects origins that are not present in CORS_ORIGINS', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://blocked-origin.invalid')

    expect(response.status).toBe(403)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/Origen no permitido por CORS/i)
  })

  test('rate limiting blocks repeated failed login attempts with 429', async () => {
    const isolated = await loadIsolatedApp({
      envOverrides: {
        LOGIN_RATE_LIMIT_MAX: '2',
        LOGIN_RATE_LIMIT_WINDOW_MS: '60000',
      },
    })

    try {
      const firstResponse = await request(isolated.app)
        .post('/api/users/login')
        .send({
          email: 'missing-rate-limit@example.com',
          password: 'WrongPassword!123',
        })

      const secondResponse = await request(isolated.app)
        .post('/api/users/login')
        .send({
          email: 'missing-rate-limit@example.com',
          password: 'WrongPassword!123',
        })

      const thirdResponse = await request(isolated.app)
        .post('/api/users/login')
        .send({
          email: 'missing-rate-limit@example.com',
          password: 'WrongPassword!123',
        })

      expect(firstResponse.status).toBe(401)
      expect(secondResponse.status).toBe(401)
      expect(thirdResponse.status).toBe(429)
      expect(thirdResponse.body.msg).toMatch(/Demasiados intentos/i)
    } finally {
      await isolated.cleanup()
    }
  })

  test('unhandled errors return a generic 500 without leaking internal details', async () => {
    const isolated = await loadIsolatedApp({
      routeFactory: () => {
        const router = require('express').Router()

        router.get('/health', (req, res) => {
          throw new Error('secret internal stack detail')
        })

        return router
      },
    })

    try {
      const response = await request(isolated.app).get('/api/health')

      expect(response.status).toBe(500)
      expect(response.body.status).toBe(false)
      expect(response.body.msg).toBe('Unexpected server error')
      expect(JSON.stringify(response.body)).not.toMatch(/secret internal stack detail/i)
    } finally {
      await isolated.cleanup()
    }
  })
})
