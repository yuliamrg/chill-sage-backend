const { DataTypes } = require('sequelize')

const sequelize = require('./dbconnection')

const getTableDefinition = async (queryInterface, tableCache, tableName) => {
  if (!tableCache.has(tableName)) {
    tableCache.set(tableName, await queryInterface.describeTable(tableName))
  }

  return tableCache.get(tableName)
}

const getTableIndexes = async (queryInterface, indexCache, tableName) => {
  if (!indexCache.has(tableName)) {
    indexCache.set(tableName, await queryInterface.showIndex(tableName))
  }

  return indexCache.get(tableName)
}

const invalidateTableMetadata = (tableCache, indexCache, tableName) => {
  tableCache.delete(tableName)
  indexCache.delete(tableName)
}

const ensureColumn = async (queryInterface, tableCache, indexCache, tableName, columnName, definition) => {
  const table = await getTableDefinition(queryInterface, tableCache, tableName)

  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition)
    invalidateTableMetadata(tableCache, indexCache, tableName)
  }
}

const ensureIndex = async (queryInterface, tableCache, indexCache, tableName, indexName, fields, options = {}) => {
  const indexes = await getTableIndexes(queryInterface, indexCache, tableName)

  if (!indexes.some((index) => index.name === indexName)) {
    await queryInterface.addIndex(tableName, {
      name: indexName,
      fields,
      ...options,
    })
    invalidateTableMetadata(tableCache, indexCache, tableName)
  }
}

const ensureScheduleEquipmentsTable = async (queryInterface, tableCache, indexCache) => {
  let exists = true

  try {
    await getTableDefinition(queryInterface, tableCache, 'schedule_equipments')
  } catch (error) {
    exists = false
  }

  if (!exists) {
    await queryInterface.createTable('schedule_equipments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'schedules',
          key: 'id',
        },
      },
      equipment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'equipments',
          key: 'id',
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
    invalidateTableMetadata(tableCache, indexCache, 'schedule_equipments')
  }

  await ensureIndex(
    queryInterface,
    tableCache,
    indexCache,
    'schedule_equipments',
    'schedule_equipments_schedule_equipment_unique',
    ['schedule_id', 'equipment_id'],
    {
    unique: true,
    }
  )
  await ensureIndex(queryInterface, tableCache, indexCache, 'schedule_equipments', 'schedule_equipments_equipment_id_idx', ['equipment_id'])
}

const ensureOperationalSchema = async () => {
  const queryInterface = sequelize.getQueryInterface()
  const tableCache = new Map()
  const indexCache = new Map()

  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'client_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'requester_user_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'equipment_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'equipments',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'type', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'corrective',
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'title', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'priority', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium',
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'requested_at', {
    type: DataTypes.DATE,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'reviewed_at', {
    type: DataTypes.DATE,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'reviewed_by_user_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'review_notes', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'requests', 'cancel_reason', {
    type: DataTypes.STRING,
    allowNull: true,
  })

  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'client_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'equipment_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'equipments',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'type', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'corrective',
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'planned_start_at', {
    type: DataTypes.DATE,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'diagnosis', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'closure_notes', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'cancel_reason', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'orders', 'received_satisfaction', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  })

  await ensureColumn(queryInterface, tableCache, indexCache, 'schedules', 'client_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'schedules', 'type', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, tableCache, indexCache, 'schedules', 'scheduled_date', {
    type: DataTypes.DATE,
    allowNull: true,
  })

  await ensureIndex(queryInterface, tableCache, indexCache, 'requests', 'requests_client_id_idx', ['client_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'requests', 'requests_equipment_id_idx', ['equipment_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'requests', 'requests_requester_user_id_idx', ['requester_user_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'requests', 'requests_status_idx', ['status'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'requests', 'requests_type_idx', ['type'])

  await ensureIndex(queryInterface, tableCache, indexCache, 'orders', 'orders_request_id_idx', ['request_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'orders', 'orders_client_id_idx', ['client_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'orders', 'orders_equipment_id_idx', ['equipment_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'orders', 'orders_user_assigned_id_idx', ['user_assigned_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'orders', 'orders_status_idx', ['status'])

  await ensureIndex(queryInterface, tableCache, indexCache, 'schedules', 'schedules_client_id_idx', ['client_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'schedules', 'schedules_status_idx', ['status'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'schedules', 'schedules_type_idx', ['type'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'schedules', 'schedules_scheduled_date_idx', ['scheduled_date'])

  await ensureScheduleEquipmentsTable(queryInterface, tableCache, indexCache)
}

module.exports = {
  ensureOperationalSchema,
}
