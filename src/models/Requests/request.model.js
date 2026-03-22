const { Model, DataTypes } = require("sequelize")

const sequelize = require('../database/dbconnection')

class Request extends Model {}

Request.init({
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
    references: {
      model: 'clients',
      key: 'id',
    },
  },
  requester_user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  equipment_id: {
    type: DataTypes.INTEGER,
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
  },
  reviewed_at: {
    type: DataTypes.DATE,
  },
  reviewed_by_user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  review_notes: {
    type: DataTypes.STRING,
  },
  cancel_reason: {
    type: DataTypes.STRING,
  },
  created_at: {
    field: 'created_at',
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated_at: {
    field: 'updated_at',
    type: DataTypes.DATE,
  },
  user_created_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "users",
      key: "id",
    },
  },
  user_updated_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "users",
      key: "id",
    },
  },
}, {
  sequelize,
  modelName: "Request",
  tableName: "requests",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['client_id'],
    },
    {
      fields: ['equipment_id'],
    },
    {
      fields: ['requester_user_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['type'],
    },
  ],
});

module.exports = Request
