import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const apiDirectory = path.dirname(fileURLToPath(import.meta.url))

const numberFromEnv = (name, fallback) => {
  const value = process.env[name]
  if (value === undefined || value.trim() === '') return fallback
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer.`)
  }
  return number
}

const origins = process.env.MOCHILASOFT_ALLOWED_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const config = {
  host: process.env.API_HOST || '127.0.0.1',
  port: numberFromEnv('API_PORT', 3001),
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: numberFromEnv('DB_PORT', 5432),
    database: process.env.DB_NAME || 'bd_mochilasoft',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    connectionTimeoutMillis: numberFromEnv('DB_CONNECTION_TIMEOUT_MS', 5000),
  },
  allowedOrigins: origins?.length
    ? origins
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  uploadDirectory: path.join(apiDirectory, 'private_uploads', 'prospectos'),
  maxUploadBytes: 5 * 1024 * 1024,
}
