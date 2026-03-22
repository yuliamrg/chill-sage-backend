const { DataTypes } = require('sequelize')

const sequelize = require('./dbconnection')

const ensureColumn = async (queryInterface, tableName, columnName, definition) => {
  const table = await queryInterface.describeTable(tableName)

  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition)
  }
}

const ensureIndex = async (queryInterface, tableName, indexName, fields, options = {}) => {
  const indexes = await queryInterface.showIndex(tableName)

  if (!indexes.some((index) => index.name === indexName)) {
    await queryInterface.addIndex(tableName, {
      name: indexName,
      fields,
      ...options,
    })
  }
}

const ensureScheduleEquipmentsTable = async (queryInterface) => {
  let exists = true

  try {
    await queryInterface.describeTable('schedule_equipments')
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
  }

  await ensureIndex(queryInterface, 'schedule_equipments', 'schedule_equipments_schedule_equipment_unique', ['schedule_id', 'equipment_id'], {
    unique: true,
  })
  await ensureIndex(queryInterface, 'schedule_equipments', 'schedule_equipments_equipment_id_idx', ['equipment_id'])
}

const ensureOperationalSchema = async () => {
  const queryInterface = sequelize.getQueryInterface()

  await ensureColumn(queryInterface, 'requests', 'client_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, 'requests', 'requester_user_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, 'requests', 'equipment_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'equipments',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, 'requests', 'type', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'corrective',
  })
  await ensureColumn(queryInterface, 'requests', 'title', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'requests', 'priority', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium',
  })
  await ensureColumn(queryInterface, 'requests', 'requested_at', {
    type: DataTypes.DATE,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'requests', 'reviewed_at', {
    type: DataTypes.DATE,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'requests', 'reviewed_by_user_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, 'requests', 'review_notes', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'requests', 'cancel_reason', {
    type: DataTypes.STRING,
    allowNull: true,
  })

  await ensureColumn(queryInterface, 'orders', 'client_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, 'orders', 'equipment_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'equipments',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, 'orders', 'type', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'corrective',
  })
  await ensureColumn(queryInterface, 'orders', 'planned_start_at', {
    type: DataTypes.DATE,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'orders', 'diagnosis', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'orders', 'closure_notes', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'orders', 'cancel_reason', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'orders', 'received_satisfaction', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  })

  await ensureColumn(queryInterface, 'schedules', 'client_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id',
    },
  })
  await ensureColumn(queryInterface, 'schedules', 'type', {
    type: DataTypes.STRING,
    allowNull: true,
  })
  await ensureColumn(queryInterface, 'schedules', 'scheduled_date', {
    type: DataTypes.DATE,
    allowNull: true,
  })

  await ensureIndex(queryInterface, 'requests', 'requests_client_id_idx', ['client_id'])
  await ensureIndex(queryInterface, 'requests', 'requests_equipment_id_idx', ['equipment_id'])
  await ensureIndex(queryInterface, 'requests', 'requests_requester_user_id_idx', ['requester_user_id'])
  await ensureIndex(queryInterface, 'requests', 'requests_status_idx', ['status'])
  await ensureIndex(queryInterface, 'requests', 'requests_type_idx', ['type'])

  await ensureIndex(queryInterface, 'orders', 'orders_request_id_idx', ['request_id'])
  await ensureIndex(queryInterface, 'orders', 'orders_client_id_idx', ['client_id'])
  await ensureIndex(queryInterface, 'orders', 'orders_equipment_id_idx', ['equipment_id'])
  await ensureIndex(queryInterface, 'orders', 'orders_user_assigned_id_idx', ['user_assigned_id'])
  await ensureIndex(queryInterface, 'orders', 'orders_status_idx', ['status'])

  await ensureIndex(queryInterface, 'schedules', 'schedules_client_id_idx', ['client_id'])
  await ensureIndex(queryInterface, 'schedules', 'schedules_status_idx', ['status'])
  await ensureIndex(queryInterface, 'schedules', 'schedules_type_idx', ['type'])
  await ensureIndex(queryInterface, 'schedules', 'schedules_scheduled_date_idx', ['scheduled_date'])

  await ensureScheduleEquipmentsTable(queryInterface)
}

module.exports = {
  ensureOperationalSchema,
}
