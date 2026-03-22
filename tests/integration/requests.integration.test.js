const request = require('supertest')

const { app } = require('../helpers/auth')
const { buildOperationsContext, cleanupOperationsContext } = require('../helpers/operationsContext')
const { trackRequest, untrack } = require('../helpers/operations')

describe('requests integration', () => {
  let ctx

  beforeAll(async () => {
    ctx = await buildOperationsContext()
  })

  afterAll(async () => {
    await cleanupOperationsContext()
  })

  test('solicitante creates a request and backend stamps requester ownership', async () => {
    const response = await request(app)
      .post('/api/requests')
      .set('Authorization', ctx.solicitanteToken)
      .send({
        client_id: ctx.clientA.id,
        requester_user_id: ctx.adminUser.id,
        equipment_id: ctx.equipmentA1.id,
        type: 'corrective',
        title: 'Cooling issue',
        description: 'The unit is failing intermittently',
        priority: 'high',
      })

    expect(response.status).toBe(201)
    expect(response.body.request.status).toBe('pending')
    expect(response.body.request.requester_user_id).toBe(ctx.solicitanteUser.id)
    expect(response.body.request.client_id).toBe(ctx.clientA.id)
    expect(response.body.request.equipment_id).toBe(ctx.equipmentA1.id)
    trackRequest(response.body.request.id)
  })

  test('planeador cannot create an order from a pending request and can approve it', async () => {
    const createRequestResponse = await request(app)
      .post('/api/requests')
      .set('Authorization', ctx.solicitanteToken)
      .send({
        client_id: ctx.clientA.id,
        equipment_id: ctx.equipmentA1.id,
        type: 'corrective',
        title: 'Pending approval request',
        description: 'Needs approval before order',
        priority: 'medium',
      })

    const pendingRequestId = createRequestResponse.body.request.id
    trackRequest(pendingRequestId)

    const pendingOrderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', ctx.planeadorToken)
      .send({
        request_id: pendingRequestId,
      })

    expect(pendingOrderResponse.status).toBe(409)
    expect(pendingOrderResponse.body.msg).toMatch(/solicitud aprobada/i)

    const approveResponse = await request(app)
      .post(`/api/requests/${pendingRequestId}/approve`)
      .set('Authorization', ctx.planeadorToken)
      .send({
        review_notes: 'Approved for execution',
      })

    expect(approveResponse.status).toBe(200)
    expect(approveResponse.body.request.status).toBe('approved')
    expect(approveResponse.body.request.reviewed_by_user_id).toBeDefined()
  })

  test('delete endpoint is reserved to admin', async () => {
    const createRequestResponse = await request(app)
      .post('/api/requests')
      .set('Authorization', ctx.solicitanteToken)
      .send({
        client_id: ctx.clientA.id,
        equipment_id: ctx.equipmentA2.id,
        type: 'inspection',
        title: 'Deletion policy request',
        description: 'Used to verify delete restrictions',
        priority: 'low',
      })

    const requestId = createRequestResponse.body.request.id
    trackRequest(requestId)

    const planeadorDeleteResponse = await request(app)
      .delete(`/api/requests/${requestId}`)
      .set('Authorization', ctx.planeadorToken)

    expect(planeadorDeleteResponse.status).toBe(403)

    const adminDeleteResponse = await request(app)
      .delete(`/api/requests/${requestId}`)
      .set('Authorization', ctx.adminToken)

    expect(adminDeleteResponse.status).toBe(200)
    untrack('requests', requestId)
  })
})
