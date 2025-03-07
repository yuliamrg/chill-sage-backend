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
  status: {
    type: DataTypes.STRING,
    allowNull: false,
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
});

module.exports = Request