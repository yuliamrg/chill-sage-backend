module.exports = async () => {
  const db = require('../src/models/database/dbconnection')

  if (db) {
    await db.close().catch(() => {})
  }

  await new Promise((resolve) => setImmediate(resolve))
}
