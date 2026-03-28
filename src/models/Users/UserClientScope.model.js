const { Model, DataTypes } = require('sequelize')

const sequelize = require('../database/dbconnection')

class UserClientScope extends Model {}

UserClientScope.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
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
  },
  {
    sequelize,
    modelName: 'UserClientScope',
    tableName: 'user_client_scopes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'client_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['client_id'],
      },
    ],
  }
)

module.exports = UserClientScope
