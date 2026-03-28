const { DataTypes, QueryTypes } = require('sequelize')

const { ensureColumn, ensureIndex, ensureTable } = require('./helpers')

const renamePlatformAdminRole = async ({ queryInterface, sequelize }) => {
  const existingPlatformRole = await queryInterface.sequelize.query(
    'SELECT id FROM roles WHERE description = ? LIMIT 1',
    {
      replacements: ['admin_plataforma'],
      type: QueryTypes.SELECT,
    }
  )

  if (existingPlatformRole.length) {
    return
  }

  const legacyAdminRole = await queryInterface.sequelize.query(
    'SELECT id FROM roles WHERE id = ? LIMIT 1',
    {
      replacements: [1],
      type: QueryTypes.SELECT,
    }
  )

  if (legacyAdminRole.length) {
    await queryInterface.bulkUpdate('roles', { description: 'admin_plataforma' }, { id: 1 })
    return
  }

  await queryInterface.bulkInsert('roles', [
    {
      id: 1,
      description: 'admin_plataforma',
      created_at: sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  ])
}

const ensureClientAdminRole = async ({ queryInterface, sequelize }) => {
  const existingRole = await queryInterface.sequelize.query(
    'SELECT id FROM roles WHERE id = ? LIMIT 1',
    {
      replacements: [5],
      type: QueryTypes.SELECT,
    }
  )

  if (existingRole.length) {
    await queryInterface.bulkUpdate('roles', { description: 'admin_cliente' }, { id: 5 })
    return
  }

  await queryInterface.bulkInsert('roles', [
    {
      id: 5,
      description: 'admin_cliente',
      created_at: sequelize.literal('CURRENT_TIMESTAMP'),
      updated_at: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  ])
}

const backfillUserClientScopes = async ({ queryInterface, sequelize }) => {
  const usersWithClient = await queryInterface.sequelize.query(
    'SELECT id, client FROM users WHERE client IS NOT NULL',
    { type: QueryTypes.SELECT }
  )

  for (const user of usersWithClient) {
    const existingScope = await queryInterface.sequelize.query(
      'SELECT id FROM user_client_scopes WHERE user_id = ? AND client_id = ? LIMIT 1',
      {
        replacements: [user.id, user.client],
        type: QueryTypes.SELECT,
      }
    )

    if (existingScope.length) {
      continue
    }

    await queryInterface.bulkInsert('user_client_scopes', [
      {
        user_id: user.id,
        client_id: user.client,
        created_at: sequelize.literal('CURRENT_TIMESTAMP'),
        updated_at: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    ])
  }
}

const up = async ({ queryInterface, sequelize, tableCache, indexCache }) => {
  await ensureColumn(queryInterface, tableCache, indexCache, 'users', 'all_clients', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })

  await ensureTable(queryInterface, tableCache, indexCache, 'user_client_scopes', {
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
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  })

  await ensureIndex(queryInterface, tableCache, indexCache, 'user_client_scopes', 'user_client_scopes_user_client_unique', ['user_id', 'client_id'], {
    unique: true,
  })
  await ensureIndex(queryInterface, tableCache, indexCache, 'user_client_scopes', 'user_client_scopes_user_id_index', ['user_id'])
  await ensureIndex(queryInterface, tableCache, indexCache, 'user_client_scopes', 'user_client_scopes_client_id_index', ['client_id'])

  await renamePlatformAdminRole({ queryInterface, sequelize })
  await ensureClientAdminRole({ queryInterface, sequelize })
  await backfillUserClientScopes({ queryInterface, sequelize })
}

module.exports = {
  description: 'Add user client scopes, all-clients support, and split admin roles',
  up,
}
