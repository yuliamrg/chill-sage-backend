const { Model, DataTypes } = require("sequelize")

const sequelize = require('../database/dbconnection')

class Schedule extends Model {}

Schedule.init({
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
  description: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
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
  modelName: "Scheule",
  tableName: "schedules",
  timestamps: true,
});

module.exports = Schedule