const { Model, DataTypes } = require("sequelize")

const sequelize = require('../../database/dbconneciont')

class Brand extends Model {}

Brand.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isactive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  user_creates_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_updates_id: {
    type: DataTypes.INTEGER,
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
}, {
  sequelize,
  modelName: 'Brand',
  tableName: 'brands',
  timestamps: true,

  indexes: [
    {
      unique: true,
      fields: ['code']
    }
  ]
},
)

module.exports = Brand