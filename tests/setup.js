jest.setTimeout(30000)

afterAll(async () => {
  const db = require('../src/models/database/dbconnection')

  if (db) {
    await db.close()
  }
})
