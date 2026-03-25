require('dotenv').config()

const db = require('../src/models/database/dbconnection')
const { initializeModelAssociations } = require('../src/models')
const { ensureOperationalSchema } = require('../src/models/database/ensureOperationalSchema')

const run = async () => {
  await db.authenticate()
  initializeModelAssociations()

  if (process.env.DB_SYNC === 'true') {
    await db.sync({ force: false })
  }

  await ensureOperationalSchema()
  console.log('Operational schema ensured')
}

run()
  .catch((error) => {
    console.error('Schema bootstrap failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.close().catch(() => {})
  })
