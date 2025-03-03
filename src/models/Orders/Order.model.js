const { Model, DataTypes } = require("sequelize")

const sequelize = require('../database/dbconnection')

class Order extends Model {}

Order.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  user_asigned_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "users",
      key: "id",
    },
  },
  resquest_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "requests",
      key: "id",
    },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATE,
  },
  end_date: {
    type: DataTypes.DATE,
  },
  description: {
    type: DataTypes.STRING,
  },
  hours: {
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
}, {
  sequelize,
  modelName: "Order",
  tableName: "orders",
  timestamps: true,
});

module.exports = Order