const request = require('supertest')

const { app } = require('../helpers/auth')
const { buildOperationsContext, cleanupOperationsContext } = require('../helpers/operationsContext')
const { createClientFixture, trackRequest } = require('../helpers/operations')

describe('pagination integration', () => {
  let ctx

  beforeAll(async () => {
    ctx = await buildOperationsContext()
  })

  afterAll(async () => {
    await cleanupOperationsContext()
  })

  test('clients list supports page, limit, sort and pagination metadata', async () => {
    await createClientFixture({
      adminUserId: ctx.adminUser.id,
      suffix: 'pagination-low',
      overrides: {
        name: '000 Pagination Client',
        email: 'pagination-low@example.com',
      },
    })

    await createClientFixture({
      adminUserId: ctx.adminUser.id,
      suffix: 'pagination-high',
      overrides: {
        name: '999 Pagination Client',
        email: 'pagination-high@example.com',
      },
    })

    const response = await request(app)
      .get('/api/clients?page=1&limit=1&sort=name:ASC')
      .set('Authorization', ctx.adminToken)

    expect(response.status).toBe(200)
    expect(response.body.clients).toHaveLength(1)
    expect(response.body.clients[0].name).toBe('000 Pagination Client')
    expect(response.body.meta).toEqual({
      pagination: expect.objectContaining({
        page: 1,
        limit: 1,
        total: expect.any(Number),
        total_pages: expect.any(Number),
        returned: 1,
        has_next_page: expect.any(Boolean),
        has_previous_page: false,
      }),
      sort: {
        field: 'name',
        direction: 'ASC',
      },
    })
    expect(response.body.meta.pagination.total).toBeGreaterThanOrEqual(2)
  })

  test('requests list returns pagination metadata and rejects invalid sort fields', async () => {
    const createResponse = await request(app)
      .post('/api/requests')
      .set('Authorization', ctx.solicitanteToken)
      .send({
        client_id: ctx.clientA.id,
        equipment_id: ctx.equipmentA1.id,
        type: 'inspection',
        title: 'Pagination request contract',
        description: 'Validate paginated request listings',
        priority: 'medium',
      })

    expect(createResponse.status).toBe(201)
    trackRequest(createResponse.body.request.id)

    const paginatedResponse = await request(app)
      .get('/api/requests?page=1&limit=1&sort=requested_at:DESC')
      .set('Authorization', ctx.planeadorToken)

    expect(paginatedResponse.status).toBe(200)
    expect(paginatedResponse.body.requests).toHaveLength(1)
    expect(paginatedResponse.body.meta).toEqual({
      pagination: expect.objectContaining({
        page: 1,
        limit: 1,
        total: expect.any(Number),
        total_pages: expect.any(Number),
        returned: 1,
        has_next_page: expect.any(Boolean),
        has_previous_page: false,
      }),
      sort: {
        field: 'requested_at',
        direction: 'DESC',
      },
    })

    const invalidSortResponse = await request(app)
      .get('/api/requests?sort=nonexistent_field:ASC')
      .set('Authorization', ctx.planeadorToken)

    expect(invalidSortResponse.status).toBe(400)
    expect(invalidSortResponse.body.msg).toMatch(/ordenamiento .*no esta permitido/i)
    expect(invalidSortResponse.body.requests).toEqual([])
    expect(invalidSortResponse.body.meta).toBeNull()
  })
})
