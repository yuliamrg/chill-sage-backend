require('dotenv').config()

const { startServer } = require('./src/app')

startServer().catch((error) => {
  console.error('Database connection error:', error)
  process.exit(1)
})
