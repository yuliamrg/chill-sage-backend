const { QueryTypes } = require('sequelize')

const db = require('../../src/models/database/dbconnection')
const { initializeModelAssociations } = require('../../src/models')
const { MIGRATIONS_TABLE, runMigrations } = require('../../src/models/database/migrations')

describe('database migrations', () => {
  beforeAll(async () => {
    await db.authenticate()
    initializeModelAssociations()
  })

  test('tracks canonical migrations and is idempotent on repeated runs', async () => {
    const firstRun = await runMigrations()
    const secondRun = await runMigrations()

    const appliedRows = await db.query(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`,
      { type: QueryTypes.SELECT }
    )

    expect(firstRun.totalKnown).toBeGreaterThanOrEqual(2)
    expect(secondRun.totalKnown).toBe(firstRun.totalKnown)
    expect(secondRun.applied).toHaveLength(0)
    expect(appliedRows).toHaveLength(firstRun.totalKnown)
    expect(appliedRows.map((row) => row.name)).toEqual(
      expect.arrayContaining([
        '202603280001-create-canonical-base-schema',
        '202603280002-apply-operational-schema',
      ])
    )
  })
})
