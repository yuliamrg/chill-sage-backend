const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

class PaginationQueryError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PaginationQueryError'
    this.statusCode = 400
  }
}

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new PaginationQueryError(`El parametro "${fieldName}" debe ser un entero positivo`)
  }

  return parsed
}

const normalizeDirection = (value) => {
  const normalized = String(value || 'DESC').trim().toUpperCase()

  if (normalized !== 'ASC' && normalized !== 'DESC') {
    throw new PaginationQueryError('El parametro "sort" debe usar direccion ASC o DESC')
  }

  return normalized
}

const parseSort = (sortValue, allowedSortFields, defaultSort) => {
  if (!sortValue) {
    return {
      field: defaultSort.field,
      direction: normalizeDirection(defaultSort.direction),
    }
  }

  const raw = String(sortValue).trim()

  if (!raw) {
    return {
      field: defaultSort.field,
      direction: normalizeDirection(defaultSort.direction),
    }
  }

  if (raw.startsWith('-')) {
    const field = raw.slice(1)

    if (!allowedSortFields.includes(field)) {
      throw new PaginationQueryError(`El campo de ordenamiento "${field}" no esta permitido`)
    }

    return {
      field,
      direction: 'DESC',
    }
  }

  const [field, direction = defaultSort.direction] = raw.split(':')

  if (!allowedSortFields.includes(field)) {
    throw new PaginationQueryError(`El campo de ordenamiento "${field}" no esta permitido`)
  }

  return {
    field,
    direction: normalizeDirection(direction),
  }
}

const buildOrder = (sort) => {
  const order = [[sort.field, sort.direction]]

  if (sort.field !== 'id') {
    order.push(['id', sort.direction])
  }

  return order
}

const parsePaginationQuery = (query, options = {}) => {
  const {
    allowedSortFields = ['id'],
    defaultSort = { field: 'id', direction: 'DESC' },
    defaultLimit = DEFAULT_LIMIT,
    maxLimit = MAX_LIMIT,
  } = options

  const page = query.page ? parsePositiveInteger(query.page, 'page') : DEFAULT_PAGE
  const limit = query.limit ? parsePositiveInteger(query.limit, 'limit') : defaultLimit

  if (limit > maxLimit) {
    throw new PaginationQueryError(`El parametro "limit" no puede ser mayor a ${maxLimit}`)
  }

  const sort = parseSort(query.sort, allowedSortFields, defaultSort)

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sort,
    order: buildOrder(sort),
  }
}

const buildPaginationMeta = ({ page, limit, total, sort, returned }) => {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0

  return {
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
      returned,
      has_next_page: totalPages > 0 ? page < totalPages : false,
      has_previous_page: page > 1,
    },
    sort,
  }
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  PaginationQueryError,
  buildPaginationMeta,
  parsePaginationQuery,
}
