const request = require('supertest')

const { app, initializeApp, getAuthHeader } = require('../helpers/auth')

describe('authorization boundaries', () => {
  beforeAll(async () => {
    await initializeApp()
  })

  test('returns 401 on protected route without token', async () => {
    const response = await request(app).get('/api/requests')

    expect(response.status).toBe(401)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/Token de autenticacion requerido/i)
  })

  test('returns 401 on protected route with invalid token', async () => {
    const response = await request(app)
      .get('/api/requests')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/Token invalido o expirado/i)
  })

  test('allows all current operational roles to read requests', async () => {
    const adminToken = await getAuthHeader('admin')
    const planeadorToken = await getAuthHeader('planeador')
    const tecnicoToken = await getAuthHeader('tecnico')
    const solicitanteToken = await getAuthHeader('solicitante')

    const responses = await Promise.all([
      request(app).get('/api/requests').set('Authorization', adminToken),
      request(app).get('/api/requests').set('Authorization', planeadorToken),
      request(app).get('/api/requests').set('Authorization', tecnicoToken),
      request(app).get('/api/requests').set('Authorization', solicitanteToken),
    ])

    for (const response of responses) {
      expect(response.status).toBe(200)
      expect(response.body.status).toBe(true)
    }
  })

  test('rejects tecnico when trying to create requests', async () => {
    const tecnicoToken = await getAuthHeader('tecnico')
    const response = await request(app)
      .post('/api/requests')
      .set('Authorization', tecnicoToken)
      .send({
        description: 'request should be rejected for tecnico',
      })

    expect(response.status).toBe(403)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/No tienes permisos/i)
  })

  test('rejects planeador when trying to delete equipments', async () => {
    const planeadorToken = await getAuthHeader('planeador')
    const response = await request(app)
      .delete('/api/equipments/1')
      .set('Authorization', planeadorToken)

    expect(response.status).toBe(403)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/No tienes permisos/i)
  })

  test('rejects solicitante from reading users', async () => {
    const solicitanteToken = await getAuthHeader('solicitante')
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', solicitanteToken)

    expect(response.status).toBe(403)
    expect(response.body.status).toBe(false)
    expect(response.body.msg).toMatch(/No tienes permisos/i)
  })
})
