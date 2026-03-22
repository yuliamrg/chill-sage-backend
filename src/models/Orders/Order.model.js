const { Model, DataTypes } = require("sequelize")

const sequelize = require('../database/dbconnection')

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    assigned_user_id: {
      field: 'user_assigned_id',
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
    request_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "requests",
        key: "id",
      },
    },
    client_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'clients',
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planned_start_at: {
      type: DataTypes.DATE,
    },
    started_at: {
      field: 'start_date',
      type: DataTypes.DATE,
    },
    finished_at: {
      field: 'end_date',
      type: DataTypes.DATE,
    },
    diagnosis: {
      type: DataTypes.STRING,
    },
    work_description: {
      field: 'description',
      type: DataTypes.STRING,
    },
    closure_notes: {
      type: DataTypes.STRING,
    },
    cancel_reason: {
      type: DataTypes.STRING,
    },
    received_satisfaction: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    worked_hours: {
      field: 'hours',
      type: DataTypes.INTEGER,
    },
    created_at: {
      field: "created_at",
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      field: "updated_at",
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
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ['request_id'],
      },
      {
        fields: ['client_id'],
      },
      {
        fields: ['equipment_id'],
      },
      {
        fields: ['user_assigned_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
)

module.exports = Order
