import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createAdminRouter } from './admin.js'
import { hashPassword } from './admin-password.js'

test('protects admin routes behind a database-backed session', async (context) => {
  const username = 'erikabritooficial@gmail.com'
  const password = 'secure test passphrase'
  const credentials = await hashPassword(password)
  const sessions = new Map()
  const pool = {
    async query(sql, values = []) {
      if (sql.includes('FROM public.admin_usuario')) {
        return {
          rows: [{
            id: '7',
            usuario: username,
            password_salt: credentials.salt,
            password_hash: credentials.hash,
          }],
        }
      }
      if (sql.includes('DELETE FROM public.admin_sesion WHERE expira_en')) {
        return { rows: [] }
      }
      if (sql.includes('INSERT INTO public.admin_sesion')) {
        sessions.set(values[0], { usuario_id: values[1], expira_en: values[2] })
        return { rows: [] }
      }
      if (sql.includes('FROM public.admin_sesion s')) {
        const session = sessions.get(values[0])
        return session && session.expira_en > new Date()
          ? { rows: [{ id: session.usuario_id, usuario: username }] }
          : { rows: [] }
      }
      if (sql.includes('DELETE FROM public.admin_sesion WHERE token_hash')) {
        sessions.delete(values[0])
        return { rows: [] }
      }
      throw new Error(`Unexpected SQL in test: ${sql}`)
    },
  }
  const app = express()
  app.use(express.json())
  app.use('/api/admin', createAdminRouter({ pool, uploadDirectory: 'unused' }))
  const server = app.listen(0, '127.0.0.1')
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  }))
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}/api/admin`

  const anonymous = await fetch(`${baseUrl}/session`)
  assert.equal(anonymous.status, 401)

  const login = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: username, password }),
  })
  assert.equal(login.status, 200)
  assert.deepEqual(await login.json(), { usuario: username })
  const cookie = login.headers.get('set-cookie')
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /SameSite=Lax/i)

  const session = await fetch(`${baseUrl}/session`, {
    headers: { Cookie: cookie.split(';')[0] },
  })
  assert.equal(session.status, 200)
  assert.deepEqual(await session.json(), { usuario: username })
})
