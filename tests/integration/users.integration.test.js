const request = require('supertest')

const { ROLE_IDS } = require('../../src/auth/roles')
const { app, getFallbackPassword, login } = require('../helpers/auth')
const { buildOperationsContext, cleanupOperationsContext } = require('../helpers/operationsContext')
const { createUserFixture, trackUser, untrack, uniqueSuffix } = require('../helpers/operations')

describe('users integration', () => {
  let ctx

  beforeAll(async () => {
    ctx = await buildOperationsContext()
  })

  afterAll(async () => {
    await cleanupOperationsContext()
  })

  test('admin can create users and audit fields come from auth context', async () => {
    const suffix = uniqueSuffix()
    const password = getFallbackPassword()
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', ctx.adminToken)
      .send({
        username: `  strict.user.${suffix}  `,
        name: '  Strict  ',
        last_name: '  User  ',
        email: `  strict.user.${suffix}@example.com  `,
        password,
        primary_client_id: ctx.clientA.id,
        client_ids: [ctx.clientA.id],
        role: ROLE_IDS.TECNICO,
        user_created_id: ctx.extraTechUser.id,
      })

    expect(response.status).toBe(201)
    expect(response.body.user.username).toBe(`strict.user.${suffix}`)
    expect(response.body.user.name).toBe('Strict')
    expect(response.body.user.last_name).toBe('User')
    expect(response.body.user.email).toBe(`strict.user.${suffix}@example.com`)
    expect(response.body.user.primary_client_id).toBe(ctx.clientA.id)
    expect(response.body.user.primary_client_name).toBe(ctx.clientA.name)
    expect(response.body.user.client_ids).toEqual([ctx.clientA.id])
    expect(response.body.user.role).toBe(ROLE_IDS.TECNICO)
    expect(response.body.user.status).toBe('active')
    expect(response.body.user.user_created_id).not.toBe(ctx.extraTechUser.id)
    expect(response.body.user.password).toBeUndefined()
    trackUser(response.body.user.id)

    const loginResponse = await login({
      email: response.body.user.email,
      password,
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.user.id).toBe(response.body.user.id)
  })

  test('create rejects blank required fields', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', ctx.adminToken)
      .send({
        username: '   ',
        email: 'valid@example.com',
        password: getFallbackPassword(),
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/requiere username/i)
  })

  test('create rejects invalid email values', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', ctx.adminToken)
      .send({
        username: `invalid.email.${uniqueSuffix()}`,
        email: 'not-an-email',
        password: getFallbackPassword(),
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/email del usuario no es valido/i)
  })

  test('create rejects invalid role and client references', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', ctx.adminToken)
      .send({
        username: `invalid-rel.${uniqueSuffix()}`,
        email: `invalid-rel.${uniqueSuffix()}@example.com`,
        password: getFallbackPassword(),
        role: 999999,
        primary_client_id: 999999,
        client_ids: [999999],
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/clientes asociados no existen|rol asociado no existe/i)
  })

  test('create rejects duplicate username values', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', ctx.adminToken)
      .send({
        username: ctx.extraTechUser.username,
        email: `dup-user-${uniqueSuffix()}@example.com`,
        password: getFallbackPassword(),
        primary_client_id: ctx.clientA.id,
        client_ids: [ctx.clientA.id],
      })

    expect(response.status).toBe(409)
    expect(response.body.msg).toMatch(/username ya esta en uso/i)
  })

  test('admin cannot change own role or status', async () => {
    const response = await request(app)
      .put(`/api/users/${ctx.adminUser.id}`)
      .set('Authorization', ctx.adminToken)
      .send({
        role: ROLE_IDS.TECNICO,
        status: 'inactive',
      })

    expect(response.status).toBe(409)
    expect(response.body.msg).toMatch(/propio rol|propio estado/i)
  })

  test('admin can update another user and rotate password', async () => {
    const password = 'UpdatedPass123!'
    const response = await request(app)
      .put(`/api/users/${ctx.extraTechUser.id}`)
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Updated Tech',
        last_name: 'User',
        email: `updated.tech.${uniqueSuffix()}@example.com`,
        password,
        status: 'inactive',
      })

    expect(response.status).toBe(200)
    expect(response.body.user.name).toBe('Updated Tech')
    expect(response.body.user.status).toBe('inactive')

    const loginResponse = await login({
      email: response.body.user.email,
      password,
    })

    expect(loginResponse.status).toBe(401)
    expect(loginResponse.body.msg).toMatch(/usuario inactivo/i)
  })

  test('delete rejects self-deletion', async () => {
    const response = await request(app)
      .delete(`/api/users/${ctx.adminUser.id}`)
      .set('Authorization', ctx.adminToken)

    expect(response.status).toBe(409)
    expect(response.body.msg).toMatch(/no puedes eliminar tu propio usuario/i)
  })

  test('admin can delete orphan users', async () => {
    const orphanUser = await createUserFixture({
      adminUserId: ctx.adminUser.id,
      suffix: `orphan-${uniqueSuffix()}`,
      password: getFallbackPassword(),
      overrides: {
        primary_client_id: ctx.clientB.id,
        client_ids: [ctx.clientB.id],
        role: ROLE_IDS.SOLICITANTE,
      },
    })

    const response = await request(app)
      .delete(`/api/users/${orphanUser.id}`)
      .set('Authorization', ctx.adminToken)

    expect(response.status).toBe(200)
    expect(response.body.user.id).toBe(orphanUser.id)
    untrack('users', orphanUser.id)
  })
})
