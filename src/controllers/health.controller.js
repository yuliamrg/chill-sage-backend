const db = require('../models/database/dbconnection')
const { success, failure } = require('../utils/apiResponse')

const getHealth = async (req, res) => {
  try {
    await db.authenticate()

    return success(res, 200, 'Service healthy', {
      health: {
        status: 'ok',
        uptime_seconds: Number(process.uptime().toFixed(0)),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return failure(res, 503, 'Service unhealthy', {
      health: {
        status: 'error',
        timestamp: new Date().toISOString(),
      },
    })
  }
}

module.exports = {
  getHealth,
}
