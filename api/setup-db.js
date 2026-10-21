import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './database.js'

const apiDirectory = path.dirname(fileURLToPath(import.meta.url))

try {
  const schema = await readFile(path.join(apiDirectory, '..', 'database', 'schema.sql'), 'utf8')
  await pool.query(schema)
  console.log('PostgreSQL schema is ready.')
} catch (error) {
  console.error('Could not initialize the PostgreSQL schema.', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
