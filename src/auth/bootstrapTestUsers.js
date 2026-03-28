const bcrypt = require('bcrypt')
const { Op } = require('sequelize')

const User = require('../models/Users/User.model')
const { ROLE_IDS } = require('./roles')

const TEST_USERS = [
  {
    roleId: ROLE_IDS.ADMIN_PLATAFORMA,
    usernameEnv: 'TEST_ADMIN_USERNAME',
    emailEnv: 'TEST_ADMIN_EMAIL',
    passwordEnv: 'TEST_ADMIN_PASSWORD',
    defaults: {
      username: 'admin.test',
      email: 'admin.test@chillsage.local',
      password: 'Admin123!',
      name: 'Admin',
      last_name: 'Test',
    },
  },
  {
    roleId: ROLE_IDS.SOLICITANTE,
    usernameEnv: 'TEST_SOLICITANTE_USERNAME',
    emailEnv: 'TEST_SOLICITANTE_EMAIL',
    passwordEnv: 'TEST_SOLICITANTE_PASSWORD',
    defaults: {
      username: 'solicitante.test',
      email: 'solicitante.test@chillsage.local',
      password: 'Solicitante123!',
      name: 'Solicitante',
      last_name: 'Test',
    },
  },
  {
    roleId: ROLE_IDS.PLANEADOR,
    usernameEnv: 'TEST_PLANEADOR_USERNAME',
    emailEnv: 'TEST_PLANEADOR_EMAIL',
    passwordEnv: 'TEST_PLANEADOR_PASSWORD',
    defaults: {
      username: 'planeador.test',
      email: 'planeador.test@chillsage.local',
      password: 'Planeador123!',
      name: 'Planeador',
      last_name: 'Test',
    },
  },
  {
    roleId: ROLE_IDS.TECNICO,
    usernameEnv: 'TEST_TECNICO_USERNAME',
    emailEnv: 'TEST_TECNICO_EMAIL',
    passwordEnv: 'TEST_TECNICO_PASSWORD',
    defaults: {
      username: 'tecnico.test',
      email: 'tecnico.test@chillsage.local',
      password: 'Tecnico123!',
      name: 'Tecnico',
      last_name: 'Test',
    },
  },
]

const resolveTestUserConfig = ({ usernameEnv, emailEnv, passwordEnv, defaults }) => ({
  username: process.env[usernameEnv] || defaults.username,
  email: process.env[emailEnv] || defaults.email,
  password: process.env[passwordEnv] || defaults.password,
  name: defaults.name,
  last_name: defaults.last_name,
})

const ensureTestUser = async ({ roleId, usernameEnv, emailEnv, passwordEnv, defaults }) => {
  const config = resolveTestUserConfig({ usernameEnv, emailEnv, passwordEnv, defaults })

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ username: config.username }, { email: config.email }],
    },
  })

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(config.password, 10)

    await User.create({
      username: config.username,
      email: config.email,
      password: passwordHash,
      name: config.name,
      last_name: config.last_name,
      role: roleId,
      status: 'active',
    })
    return
  }

  const updates = {}

  if (existingUser.username !== config.username) {
    updates.username = config.username
  }

  if (existingUser.email !== config.email) {
    updates.email = config.email
  }

  if (existingUser.name !== config.name) {
    updates.name = config.name
  }

  if (existingUser.last_name !== config.last_name) {
    updates.last_name = config.last_name
  }

  if (existingUser.role !== roleId) {
    updates.role = roleId
  }

  if (existingUser.status !== 'active') {
    updates.status = 'active'
  }

  const matchesPassword = await bcrypt.compare(config.password, existingUser.password)
  if (!matchesPassword) {
    updates.password = await bcrypt.hash(config.password, 10)
  }

  if (Object.keys(updates).length > 0) {
    await existingUser.update(updates)
  }
}

const ensureTestUsers = async () => {
  for (const testUser of TEST_USERS) {
    await ensureTestUser(testUser)
  }
}

module.exports = {
  ensureTestUsers,
}
