const request = require('supertest')

const { app } = require('../helpers/auth')
const { buildOperationsContext, cleanupOperationsContext } = require('../helpers/operationsContext')
const { createClientFixture, trackClient, untrack } = require('../helpers/operations')

describe('clients integration', () => {
  let ctx

  beforeAll(async () => {
    ctx = await buildOperationsContext()
  })

  afterAll(async () => {
    await cleanupOperationsContext()
  })

  test('planeador can create client but audit fields come from auth context', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', ctx.planeadorToken)
      .send({
        name: '  Client Strict Create  ',
        email: '  client.strict@example.com  ',
        address: '  Main office  ',
        phone: '  +57 300 123 4567  ',
        description: '  Front desk contact  ',
        status: 'active',
        user_created_id: ctx.adminUser.id,
      })

    expect(response.status).toBe(201)
    expect(response.body.client.name).toBe('Client Strict Create')
    expect(response.body.client.email).toBe('client.strict@example.com')
    expect(response.body.client.address).toBe('Main office')
    expect(response.body.client.phone).toBe('+57 300 123 4567')
    expect(response.body.client.user_created_id).not.toBe(ctx.adminUser.id)
    trackClient(response.body.client.id)
  })

  test('create rejects blank required fields', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', ctx.adminToken)
      .send({
        name: '   ',
        email: 'valid@example.com',
        status: 'active',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/requiere name/i)
  })

  test('create rejects invalid email values', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Invalid Email Client',
        email: 'not-an-email',
        status: 'active',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/email del cliente no es valido/i)
  })

  test('create rejects invalid phone values', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Invalid Phone Client',
        email: 'invalid-phone@example.com',
        phone: 'abc',
        status: 'active',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/telefono del cliente no es valido/i)
  })

  test('create rejects invalid status values', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Invalid Status Client',
        email: 'invalid-status@example.com',
        status: 'enabled',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/estado del cliente no es valido/i)
  })

  test('planeador cannot change client master identity fields on update', async () => {
    const response = await request(app)
      .put(`/api/clients/${ctx.clientA.id}`)
      .set('Authorization', ctx.planeadorToken)
      .send({
        name: 'Renamed by planeador',
        phone: '+57 300 765 4321',
      })

    expect(response.status).toBe(409)
    expect(response.body.msg).toMatch(/solo admin puede cambiar los datos maestros/i)
  })

  test('planeador can update non-master client fields', async () => {
    const response = await request(app)
      .put(`/api/clients/${ctx.clientA.id}`)
      .set('Authorization', ctx.planeadorToken)
      .send({
        address: 'Updated planning office',
        phone: '+57 300 999 0000',
        description: 'Operational contact updated',
        status: 'inactive',
        user_updated_id: ctx.adminUser.id,
      })

    expect(response.status).toBe(200)
    expect(response.body.client.address).toBe('Updated planning office')
    expect(response.body.client.phone).toBe('+57 300 999 0000')
    expect(response.body.client.status).toBe('inactive')
    expect(response.body.client.user_updated_id).not.toBe(ctx.adminUser.id)
  })

  test('admin can update client master identity fields', async () => {
    const response = await request(app)
      .put(`/api/clients/${ctx.clientB.id}`)
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Admin Updated Client',
        email: 'admin.updated.client@example.com',
      })

    expect(response.status).toBe(200)
    expect(response.body.client.name).toBe('Admin Updated Client')
    expect(response.body.client.email).toBe('admin.updated.client@example.com')
  })

  test('delete rejects clients with related operational records', async () => {
    const response = await request(app)
      .delete(`/api/clients/${ctx.clientA.id}`)
      .set('Authorization', ctx.adminToken)

    expect(response.status).toBe(409)
    expect(response.body.msg).toMatch(/recursos asociados/i)
    expect(response.body.msg).toMatch(/equipos/i)
  })

  test('admin can delete orphan clients', async () => {
    const orphanClient = await createClientFixture({
      adminUserId: ctx.adminUser.id,
      suffix: 'orphan-delete',
    })

    const response = await request(app)
      .delete(`/api/clients/${orphanClient.id}`)
      .set('Authorization', ctx.adminToken)

    expect(response.status).toBe(200)
    expect(response.body.client.id).toBe(orphanClient.id)
    untrack('clients', orphanClient.id)
  })
})
