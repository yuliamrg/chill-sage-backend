const request = require('supertest')

const { app } = require('../helpers/auth')
const { buildOperationsContext, cleanupOperationsContext } = require('../helpers/operationsContext')
const { trackOrder, trackRequest } = require('../helpers/operations')

describe('orders integration', () => {
  let ctx

  beforeAll(async () => {
    ctx = await buildOperationsContext()
  })

  afterAll(async () => {
    await cleanupOperationsContext()
  })

  test('order workflow enforces assigned technician and completion data', async () => {
    const createRequestResponse = await request(app)
      .post('/api/requests')
      .set('Authorization', ctx.solicitanteToken)
      .send({
        client_id: ctx.clientA.id,
        equipment_id: ctx.equipmentA1.id,
        type: 'corrective',
        title: 'Order workflow request',
        description: 'This request will become an order',
        priority: 'critical',
      })

    const requestId = createRequestResponse.body.request.id
    trackRequest(requestId)

    await request(app)
      .post(`/api/requests/${requestId}/approve`)
      .set('Authorization', ctx.planeadorToken)
      .send({
        review_notes: 'Ready for order creation',
      })

    const createOrderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', ctx.planeadorToken)
      .send({
        request_id: requestId,
        assigned_user_id: ctx.tecnicoUser.id,
      })

    expect(createOrderResponse.status).toBe(201)
    expect(createOrderResponse.body.order.status).toBe('assigned')
    const orderId = createOrderResponse.body.order.id
    trackOrder(orderId)

    const unassignedTechStartResponse = await request(app)
      .post(`/api/orders/${orderId}/start`)
      .set('Authorization', ctx.extraTechToken)
      .send({})

    expect(unassignedTechStartResponse.status).toBe(403)
    expect(unassignedTechStartResponse.body.msg).toMatch(/no tienes permisos|tecnico asignado/i)

    const assignedTechStartResponse = await request(app)
      .post(`/api/orders/${orderId}/start`)
      .set('Authorization', ctx.tecnicoToken)
      .send({})

    expect(assignedTechStartResponse.status).toBe(200)
    expect(assignedTechStartResponse.body.order.status).toBe('in_progress')

    const incompleteCompletionResponse = await request(app)
      .post(`/api/orders/${orderId}/complete`)
      .set('Authorization', ctx.tecnicoToken)
      .send({
        worked_hours: 2,
      })

    expect(incompleteCompletionResponse.status).toBe(400)
    expect(incompleteCompletionResponse.body.msg).toMatch(/work_description/i)

    const completeOrderResponse = await request(app)
      .post(`/api/orders/${orderId}/complete`)
      .set('Authorization', ctx.tecnicoToken)
      .send({
        worked_hours: 2,
        work_description: 'Replaced the thermostat and restored cooling cycle',
        diagnosis: 'Faulty thermostat',
        closure_notes: 'Unit stable after test run',
        received_satisfaction: true,
      })

    expect(completeOrderResponse.status).toBe(200)
    expect(completeOrderResponse.body.order.status).toBe('completed')
    expect(completeOrderResponse.body.order.assigned_user_id).toBe(ctx.tecnicoUser.id)
    expect(completeOrderResponse.body.order.received_satisfaction).toBe(true)
  })
})
