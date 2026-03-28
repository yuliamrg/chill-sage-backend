jest.setTimeout(30000)

const db = require('../src/models/database/dbconnection')
const { initializeModelAssociations } = require('../src/models')
const { ensureRoles } = require('../src/auth/bootstrapRoles')
const { ensureTestUsers } = require('../src/auth/bootstrapTestUsers')
const { runMigrations } = require('../src/models/database/migrations')

beforeAll(async () => {
  await db.authenticate()
  initializeModelAssociations()
  await runMigrations()
  await ensureRoles()
  await ensureTestUsers()
})
