const request = require('supertest')

const { app, initializeApp } = require('../helpers/auth')

describe('observability basics', () => {
  beforeAll(async () => {
    await initializeApp()
  })

  test('returns health check without authentication and exposes request id header', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe(true)
    expect(response.body.health.status).toBe('ok')
    expect(response.headers['x-request-id']).toEqual(expect.any(String))
  })

  test('preserves incoming request id header', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('X-Request-Id', 'frontend-debug-request-id')

    expect(response.status).toBe(200)
    expect(response.headers['x-request-id']).toBe('frontend-debug-request-id')
  })

  test('returns request id header on protected route failures too', async () => {
    const response = await request(app).get('/api/requests')

    expect(response.status).toBe(401)
    expect(response.headers['x-request-id']).toEqual(expect.any(String))
  })
})
