require('dotenv').config()

const db = require('../src/models/database/dbconnection')
const { initializeModelAssociations } = require('../src/models')
const { runMigrations } = require('../src/models/database/migrations')

const run = async () => {
  await db.authenticate()
  initializeModelAssociations()

  if (process.env.DB_SYNC === 'true') {
    await db.sync({ force: false })
  }

  const result = await runMigrations()
  console.log(`Schema migrations completed. Applied ${result.applied.length} of ${result.totalKnown} known migrations.`)
}

run()
  .catch((error) => {
    console.error('Schema bootstrap failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.close().catch(() => {})
  })
