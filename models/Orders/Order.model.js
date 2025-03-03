const { Model, DataTypes } = require("sequelize")

const sequelize = require('../database/dbconneciont')

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
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
  },
  resquest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_at: {
    field: "created_at",
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated_at: {
    field: "updated_at",
    type: DataTypes.DATE,
    allowNull: false,
  },
  user_created_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
  },
  user_updated_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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