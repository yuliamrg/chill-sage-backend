require('dotenv').config()

const db = require('../src/models/database/dbconnection')
const { ensureRoles } = require('../src/auth/bootstrapRoles')
const { ensureTestUsers } = require('../src/auth/bootstrapTestUsers')

const run = async () => {
  await db.authenticate()
  await ensureRoles()
  await ensureTestUsers()
  console.log('Roles and test users ensured')
}

run()
  .catch((error) => {
    console.error('Auth bootstrap failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.close().catch(() => {})
  })
