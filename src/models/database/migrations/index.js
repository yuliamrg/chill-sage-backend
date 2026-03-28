const fs = require('fs')
const path = require('path')

const sequelize = require('../dbconnection')

const MIGRATIONS_TABLE = 'schema_migrations'

const loadMigrationDefinitions = () => {
  const migrationDir = __dirname

  return fs
    .readdirSync(migrationDir)
    .filter((fileName) => /^\d+.*\.js$/.test(fileName))
    .sort()
    .map((fileName) => {
      const migration = require(path.join(migrationDir, fileName))

      return {
        name: fileName.replace(/\.js$/, ''),
        ...migration,
      }
    })
}

const ensureMigrationsTable = async (queryInterface) => {
  const tables = await queryInterface.showAllTables()
  const normalizedTables = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name))

  if (!normalizedTables.includes(MIGRATIONS_TABLE)) {
    await queryInterface.createTable(MIGRATIONS_TABLE, {
      id: {
        type: sequelize.Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      applied_at: {
        type: sequelize.Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
  }
}

const getAppliedMigrationNames = async (queryInterface) => {
  const rows = await queryInterface.sequelize.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`,
    { type: sequelize.Sequelize.QueryTypes.SELECT }
  )

  return new Set(rows.map((row) => row.name))
}

const runMigrations = async () => {
  const queryInterface = sequelize.getQueryInterface()
  const migrations = loadMigrationDefinitions()

  await ensureMigrationsTable(queryInterface)
  const appliedMigrationNames = await getAppliedMigrationNames(queryInterface)

  const applied = []

  for (const migration of migrations) {
    if (appliedMigrationNames.has(migration.name)) {
      continue
    }

    await migration.up({
      queryInterface,
      sequelize,
      tableCache: new Map(),
      indexCache: new Map(),
    })

    await queryInterface.bulkInsert(MIGRATIONS_TABLE, [
      {
        name: migration.name,
        applied_at: new Date(),
      },
    ])

    applied.push(migration.name)
  }

  return {
    applied,
    totalKnown: migrations.length,
  }
}

module.exports = {
  MIGRATIONS_TABLE,
  runMigrations,
}
