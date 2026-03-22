const { Model, DataTypes } = require('sequelize')

const sequelize = require('../database/dbconnection')

class ScheduleEquipment extends Model {}

ScheduleEquipment.init(
  {
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
    modelName: 'ScheduleEquipment',
    tableName: 'schedule_equipments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['schedule_id', 'equipment_id'],
      },
      {
        fields: ['equipment_id'],
      },
    ],
  }
)

module.exports = ScheduleEquipment
