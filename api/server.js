import express from 'express'
import { config } from './config.js'
import { pool } from './database.js'
import { createAdminRouter } from './admin.js'
import { createProspectRouter } from './prospectos.js'

if (!config.database.password) {
  throw new Error('DB_PASSWORD is required. Configure it in the project .env file or the server environment.')
}

const app = express()

app.use('/api', (request, response, next) => {
  const origin = request.get('origin')
  if (origin && !config.allowedOrigins.includes(origin)) {
    return response.status(403).json({ error: 'Origen de solicitud no permitido.' })
  }
  if (origin) {
    response.set('Access-Control-Allow-Origin', origin)
    response.set('Vary', 'Origin')
    response.set('Access-Control-Allow-Credentials', 'true')
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.set('Access-Control-Allow-Headers', 'Content-Type')
  }
  if (request.method === 'OPTIONS') return response.sendStatus(204)
  return next()
})

app.use(express.json({ limit: '10kb' }))

app.get('/api/health', async (request, response, next) => {
  try {
    await pool.query('SELECT 1')
    return response.json({ status: 'ok' })
  } catch (error) {
    return next(error)
  }
})

app.use('/api/admin', createAdminRouter({
  pool,
  uploadDirectory: config.uploadDirectory,
}))

app.use('/api/prospectos', createProspectRouter({
  pool,
  uploadDirectory: config.uploadDirectory,
  maxUploadBytes: config.maxUploadBytes,
}))

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error)
  console.error('MochilaSoft API request failed.', error)
  return response.status(500).json({
    error: 'No pudimos guardar tu solicitud. Intenta nuevamente más tarde.',
  })
})

const server = app.listen(config.port, config.host, () => {
  console.log(`MochilaSoft API listening at http://${config.host}:${config.port}`)
})

async function shutdown() {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
