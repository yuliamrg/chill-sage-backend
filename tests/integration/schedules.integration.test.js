const request = require('supertest')

const { app } = require('../helpers/auth')
const { buildOperationsContext, cleanupOperationsContext } = require('../helpers/operationsContext')
const { trackSchedule } = require('../helpers/operations')

describe('schedules integration', () => {
  let ctx

  beforeAll(async () => {
    ctx = await buildOperationsContext()
  })

  afterAll(async () => {
    await cleanupOperationsContext()
  })

  test('schedule requires same-client equipments and stores many-to-many associations', async () => {
    const validScheduleResponse = await request(app)
      .post('/api/schedules')
      .set('Authorization', ctx.planeadorToken)
      .send({
        client_id: ctx.clientA.id,
        name: 'April preventive round',
        type: 'preventive',
        scheduled_date: '2026-04-15T08:00:00.000Z',
        description: 'Monthly preventive maintenance',
        equipment_ids: [ctx.equipmentA1.id, ctx.equipmentA2.id],
      })

    expect(validScheduleResponse.status).toBe(201)
    expect(validScheduleResponse.body.schedule.status).toBe('unassigned')
    expect(validScheduleResponse.body.schedule.equipment_ids).toEqual(expect.arrayContaining([ctx.equipmentA1.id, ctx.equipmentA2.id]))
    trackSchedule(validScheduleResponse.body.schedule.id)

    const invalidScheduleResponse = await request(app)
      .post('/api/schedules')
      .set('Authorization', ctx.planeadorToken)
      .send({
        client_id: ctx.clientA.id,
        name: 'Invalid mixed client round',
        type: 'preventive',
        scheduled_date: '2026-04-20T08:00:00.000Z',
        description: 'Should fail because of client mismatch',
        equipment_ids: [ctx.equipmentA1.id, ctx.equipmentB1.id],
      })

    expect(invalidScheduleResponse.status).toBe(400)
    expect(invalidScheduleResponse.body.msg).toMatch(/mismo cliente/i)
  })
})
