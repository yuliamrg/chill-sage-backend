const { DataTypes } = require('sequelize')

const { ensureColumn, ensureIndex, ensureTable, timestamps } = require('./helpers')

const applyOperationalSchema = async ({ queryInterface, sequelize, tableCache, indexCache }) => {
  await ensureTable(queryInterface, tableCache, indexCache, 'requests', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
    },
    requester_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'equipments',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'corrective',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requested_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    review_notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancel_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
  })

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

  await ensureTable(queryInterface, tableCache, indexCache, 'orders', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_assigned_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'requests',
        key: 'id',
      },
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'equipments',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'corrective',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planned_start_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    closure_notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancel_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    received_satisfaction: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
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

  await ensureTable(queryInterface, tableCache, indexCache, 'schedules', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scheduled_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
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

  await ensureTable(queryInterface, tableCache, indexCache, 'schedule_equipments', {
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
    ...timestamps(sequelize),
  })
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
  await ensureIndex(
    queryInterface,
    tableCache,
    indexCache,
    'schedule_equipments',
    'schedule_equipments_equipment_id_idx',
    ['equipment_id']
  )
}

module.exports = {
  description: 'Create and backfill operational schema changes',
  up: applyOperationalSchema,
}
