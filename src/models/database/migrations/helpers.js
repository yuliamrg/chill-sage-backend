const { DataTypes } = require('sequelize')

const getTableDefinition = async (queryInterface, tableCache, tableName) => {
  if (!tableCache.has(tableName)) {
    tableCache.set(tableName, await queryInterface.describeTable(tableName))
  }

  return tableCache.get(tableName)
}

const getTableIndexes = async (queryInterface, indexCache, tableName) => {
  if (!indexCache.has(tableName)) {
    indexCache.set(tableName, await queryInterface.showIndex(tableName))
  }

  return indexCache.get(tableName)
}

const invalidateTableMetadata = (tableCache, indexCache, tableName) => {
  tableCache.delete(tableName)
  indexCache.delete(tableName)
}

const tableExists = async (queryInterface, tableCache, tableName) => {
  try {
    await getTableDefinition(queryInterface, tableCache, tableName)
    return true
  } catch (error) {
    return false
  }
}

const ensureTable = async (queryInterface, tableCache, indexCache, tableName, definition) => {
  if (!(await tableExists(queryInterface, tableCache, tableName))) {
    await queryInterface.createTable(tableName, definition)
    invalidateTableMetadata(tableCache, indexCache, tableName)
  }
}

const ensureColumn = async (queryInterface, tableCache, indexCache, tableName, columnName, definition) => {
  const table = await getTableDefinition(queryInterface, tableCache, tableName)

  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition)
    invalidateTableMetadata(tableCache, indexCache, tableName)
  }
}

const ensureIndex = async (queryInterface, tableCache, indexCache, tableName, indexName, fields, options = {}) => {
  const indexes = await getTableIndexes(queryInterface, indexCache, tableName)
  const normalizedTargetFields = fields.map((field) => String(field))
  const targetUnique = Boolean(options.unique)
  const matchingIndexExists = indexes.some((index) => {
    const indexFields = (index.fields || []).map((field) => String(field.attribute || field.name))
    const sameFieldOrder = indexFields.length === normalizedTargetFields.length
      && indexFields.every((field, indexPosition) => field === normalizedTargetFields[indexPosition])

    return sameFieldOrder && Boolean(index.unique) === targetUnique
  })

  if (!indexes.some((index) => index.name === indexName) && !matchingIndexExists) {
    await queryInterface.addIndex(tableName, {
      name: indexName,
      fields,
      ...options,
    })
    invalidateTableMetadata(tableCache, indexCache, tableName)
  }
}

const timestamps = (sequelize) => ({
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

module.exports = {
  ensureColumn,
  ensureIndex,
  ensureTable,
  getTableDefinition,
  invalidateTableMetadata,
  tableExists,
  timestamps,
}
