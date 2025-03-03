const { Model, DataTypes } = require('sequelize')

const sequelize = require('../database/dbconnection')

class Equipment extends Model {}

Equipment.init(
  {
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
    type: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.STRING,
    },
    brand: {
      type: DataTypes.STRING,
    },
    model: {
      type: DataTypes.STRING,
    },
    serial: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alias: {
      type: DataTypes.STRING,
    },
    client: {
      type: DataTypes.INTEGER,
      references: {
        model: 'clients',
        key: 'id',
      }
    },
    description: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    use_start_at: {
      type: DataTypes.DATE,
    },
    use_end_at: {
      type: DataTypes.DATE,
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
    },
    user_created_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Equipment',
    tableName: 'equipments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code', 'serial'],
      },
    ],
  }
)

module.exports = Equipment
