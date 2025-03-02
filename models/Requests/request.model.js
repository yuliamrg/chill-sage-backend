const { Model, DataTypes } = require("sequelize")

const sequelize = require('../database/dbconneciont')

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
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated_at: {
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
  modelName: "Request",
  tableName: "requests",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id']
    }
  ]
});

module.exports = Request