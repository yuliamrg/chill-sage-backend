const bcrypt = require('bcrypt')

const { Client, Equipment, Order, Request, Schedule, ScheduleEquipment, User } = require('../../src/models')

const trackedIds = {
  clients: new Set(),
  equipments: new Set(),
  requests: new Set(),
  orders: new Set(),
  schedules: new Set(),
  users: new Set(),
}

const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const track = (type, id) => {
  trackedIds[type].add(id)
  return id
}

const untrack = (type, id) => {
  trackedIds[type].delete(id)
}

const getUserByUsername = async (username) => User.findOne({ where: { username } })

const createClientFixture = async ({ adminUserId, suffix, overrides = {} }) => {
  const client = await Client.create({
    name: overrides.name || `Test Client ${suffix}`,
    email: overrides.email || `client-${suffix}@example.com`,
    address: overrides.address || 'Test address',
    phone: overrides.phone || '5551234567',
    description: overrides.description || 'Client fixture',
    status: overrides.status || 'active',
    user_created_id: adminUserId,
  })

  track('clients', client.id)
  return client
}

const createEquipmentFixture = async ({ adminUserId, clientId, suffix, overrides = {} }) => {
  const equipment = await Equipment.create({
    name: overrides.name || `Equipment ${suffix}`,
    type: overrides.type || 'cooling',
    location: overrides.location || 'Test room',
    brand: overrides.brand || 'Brand',
    model: overrides.model || 'Model',
    serial: overrides.serial || `SER-${suffix}`,
    code: overrides.code || `COD-${suffix}`,
    alias: overrides.alias || `Alias ${suffix}`,
    client: clientId,
    description: overrides.description || 'Equipment fixture',
    status: overrides.status || 'active',
    user_created_id: adminUserId,
  })

  track('equipments', equipment.id)
  return equipment
}

const createTechUserFixture = async ({ adminUserId, suffix, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await User.create({
    username: `tech_${suffix}`,
    email: `tech_${suffix}@example.com`,
    password: hashedPassword,
    name: 'Temp',
    last_name: 'Tech',
    role: 4,
    status: 'active',
    user_created_id: adminUserId,
  })

  track('users', user.id)
  return user
}

const trackRequest = (id) => track('requests', id)
const trackOrder = (id) => track('orders', id)
const trackSchedule = (id) => track('schedules', id)
const trackEquipment = (id) => track('equipments', id)

const cleanupTrackedFixtures = async () => {
  if (trackedIds.schedules.size) {
    await ScheduleEquipment.destroy({ where: { schedule_id: [...trackedIds.schedules] } })
  }

  if (trackedIds.orders.size) {
    await Order.destroy({ where: { id: [...trackedIds.orders] } })
  }

  if (trackedIds.requests.size) {
    await Request.destroy({ where: { id: [...trackedIds.requests] } })
  }

  if (trackedIds.schedules.size) {
    await Schedule.destroy({ where: { id: [...trackedIds.schedules] } })
  }

  if (trackedIds.equipments.size) {
    await Equipment.destroy({ where: { id: [...trackedIds.equipments] } })
  }

  if (trackedIds.users.size) {
    await User.destroy({ where: { id: [...trackedIds.users] } })
  }

  if (trackedIds.clients.size) {
    await Client.destroy({ where: { id: [...trackedIds.clients] } })
  }
}

module.exports = {
  cleanupTrackedFixtures,
  createClientFixture,
  createEquipmentFixture,
  createTechUserFixture,
  getUserByUsername,
  trackOrder,
  trackEquipment,
  trackRequest,
  trackSchedule,
  untrack,
  uniqueSuffix,
}
