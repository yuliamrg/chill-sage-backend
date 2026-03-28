const { DataTypes } = require('sequelize')

const { ensureIndex, ensureTable, timestamps } = require('./helpers')

const createCanonicalBaseSchema = async ({ queryInterface, sequelize, tableCache, indexCache }) => {
  await ensureTable(queryInterface, tableCache, indexCache, 'roles', {
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
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'roles', 'roles_description_unique', ['description'], {
    unique: true,
  })

  await ensureTable(queryInterface, tableCache, indexCache, 'profiles', {
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
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'profiles', 'profiles_description_unique', ['description'], {
    unique: true,
  })

  await ensureTable(queryInterface, tableCache, indexCache, 'clients', {
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
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'clients', 'clients_name_unique', ['name'], {
    unique: true,
  })

  await ensureTable(queryInterface, tableCache, indexCache, 'users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    client: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'users', 'users_username_unique', ['username'], {
    unique: true,
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'users', 'users_email_unique', ['email'], {
    unique: true,
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'users', 'users_username_email_unique', ['username', 'email'], {
    unique: true,
  })

  await ensureTable(queryInterface, tableCache, indexCache, 'equipments', {
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
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
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
      allowNull: true,
    },
    client: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    use_start_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    use_end_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_created_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_updated_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ...timestamps(sequelize),
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'equipments', 'equipments_code_serial_unique', ['code', 'serial'], {
    unique: true,
  })
}

module.exports = {
  description: 'Create canonical base schema tables',
  up: createCanonicalBaseSchema,
}
