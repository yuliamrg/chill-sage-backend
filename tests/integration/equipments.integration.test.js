const request = require('supertest')

const { app } = require('../helpers/auth')
const { buildOperationsContext, cleanupOperationsContext } = require('../helpers/operationsContext')
const { trackEquipment } = require('../helpers/operations')

describe('equipments integration', () => {
  let ctx

  beforeAll(async () => {
    ctx = await buildOperationsContext()
  })

  afterAll(async () => {
    await cleanupOperationsContext()
  })

  test('planeador can create equipment but audit fields come from auth context', async () => {
    const response = await request(app)
      .post('/api/equipments')
      .set('Authorization', ctx.planeadorToken)
      .send({
        name: '  Rooftop Unit  ',
        type: ' cooling ',
        location: '  Tower A ',
        brand: '  Carrier ',
        model: '  X100 ',
        serial: '  EQ-STRICT-SERIAL-1 ',
        code: '  EQ-STRICT-CODE-1 ',
        alias: '  RTU ',
        client: ctx.clientA.id,
        description: '  Main rooftop equipment ',
        status: 'active',
        user_created_id: ctx.adminUser.id,
      })

    expect(response.status).toBe(201)
    expect(response.body.equipment.name).toBe('Rooftop Unit')
    expect(response.body.equipment.serial).toBe('EQ-STRICT-SERIAL-1')
    expect(response.body.equipment.code).toBe('EQ-STRICT-CODE-1')
    expect(response.body.equipment.client).toBe(ctx.clientA.id)
    expect(response.body.equipment.client_name).toBe(ctx.clientA.name)
    expect(response.body.equipment.user_created_id).not.toBe(ctx.adminUser.id)
    trackEquipment(response.body.equipment.id)
  })

  test('create rejects blank required fields', async () => {
    const response = await request(app)
      .post('/api/equipments')
      .set('Authorization', ctx.adminToken)
      .send({
        name: '   ',
        serial: 'SER-INVALID-1',
        code: 'CODE-INVALID-1',
        client: ctx.clientA.id,
        status: 'active',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/requiere name/i)
  })

  test('create rejects invalid status values', async () => {
    const response = await request(app)
      .post('/api/equipments')
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Status guarded equipment',
        serial: 'SER-INVALID-STATUS-1',
        code: 'CODE-INVALID-STATUS-1',
        client: ctx.clientA.id,
        status: 'enabled',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/estado del equipo no es valido/i)
  })

  test('create rejects unknown client references', async () => {
    const response = await request(app)
      .post('/api/equipments')
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Unknown client equipment',
        serial: 'SER-UNKNOWN-CLIENT-1',
        code: 'CODE-UNKNOWN-CLIENT-1',
        client: 999999999,
        status: 'active',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/cliente asociado no existe/i)
  })

  test('create rejects invalid equipment lifecycle dates', async () => {
    const response = await request(app)
      .post('/api/equipments')
      .set('Authorization', ctx.adminToken)
      .send({
        name: 'Equipment with invalid dates',
        serial: 'SER-INVALID-DATE-1',
        code: 'CODE-INVALID-DATE-1',
        client: ctx.clientA.id,
        status: 'active',
        use_start_at: '2026-03-29T10:00:00.000Z',
        use_end_at: '2026-03-28T10:00:00.000Z',
      })

    expect(response.status).toBe(400)
    expect(response.body.msg).toMatch(/use_end_at/i)
  })

  test('planeador cannot change master identity fields on update', async () => {
    const response = await request(app)
      .put(`/api/equipments/${ctx.equipmentA1.id}`)
      .set('Authorization', ctx.planeadorToken)
      .send({
        serial: 'SER-REASSIGNED-BY-PLANEADOR',
        location: 'Updated floor',
      })

    expect(response.status).toBe(409)
    expect(response.body.msg).toMatch(/solo admin puede cambiar los datos maestros/i)
  })

  test('planeador can update non-master operational fields', async () => {
    const response = await request(app)
      .put(`/api/equipments/${ctx.equipmentA1.id}`)
      .set('Authorization', ctx.planeadorToken)
      .send({
        location: 'Machine room B',
        alias: 'North Wing Backup',
        description: 'Adjusted during planning review',
        status: 'maintenance',
        use_start_at: '2026-03-20T08:00:00.000Z',
        use_end_at: '2026-03-30T18:00:00.000Z',
        user_updated_id: ctx.adminUser.id,
      })

    expect(response.status).toBe(200)
    expect(response.body.equipment.location).toBe('Machine room B')
    expect(response.body.equipment.alias).toBe('North Wing Backup')
    expect(response.body.equipment.status).toBe('maintenance')
    expect(response.body.equipment.user_updated_id).not.toBe(ctx.adminUser.id)
  })

  test('admin can update master identity fields', async () => {
    const response = await request(app)
      .put(`/api/equipments/${ctx.equipmentA2.id}`)
      .set('Authorization', ctx.adminToken)
      .send({
        serial: 'SER-ADMIN-UPDATED-1',
        code: 'CODE-ADMIN-UPDATED-1',
        name: 'Admin Updated Equipment',
      })

    expect(response.status).toBe(200)
    expect(response.body.equipment.serial).toBe('SER-ADMIN-UPDATED-1')
    expect(response.body.equipment.code).toBe('CODE-ADMIN-UPDATED-1')
    expect(response.body.equipment.name).toBe('Admin Updated Equipment')
  })
})
