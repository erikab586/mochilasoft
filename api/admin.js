import { createHash, randomBytes } from 'node:crypto'
import { access } from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import { verifyPassword } from './admin-password.js'
import { isValidAdminUsername } from './admin-username.js'

const sessionCookie = 'mochilasoft_admin_session'
const sessionDurationMs = 12 * 60 * 60 * 1000
const loginWindowMs = 15 * 60 * 1000
const maxFailedLogins = 10
const failedLogins = new Map()

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

function getSessionToken(request) {
  const cookieHeader = request.get('cookie') || ''
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`))
  const token = cookie?.slice(sessionCookie.length + 1)
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null
}

function setSessionCookie(response, token) {
  response.cookie(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin',
    maxAge: sessionDurationMs,
  })
}

function clearSessionCookie(response) {
  response.clearCookie(sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin',
  })
}

function isLoginRateLimited(ipAddress) {
  const attempt = failedLogins.get(ipAddress)
  if (!attempt || Date.now() - attempt.startedAt >= loginWindowMs) {
    failedLogins.delete(ipAddress)
    return false
  }
  return attempt.count >= maxFailedLogins
}

function recordFailedLogin(ipAddress) {
  const now = Date.now()
  const current = failedLogins.get(ipAddress)
  if (!current || now - current.startedAt >= loginWindowMs) {
    failedLogins.set(ipAddress, { count: 1, startedAt: now })
  } else {
    current.count += 1
  }
  if (failedLogins.size > 1000) {
    for (const [ip, attempt] of failedLogins) {
      if (now - attempt.startedAt >= loginWindowMs) failedLogins.delete(ip)
    }
  }
}

export function createAdminRouter({ pool, uploadDirectory }) {
  const router = express.Router()

  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store')
    return next()
  })

  router.post('/login', async (request, response, next) => {
    const username = typeof request.body?.usuario === 'string'
      ? request.body.usuario.trim().toLowerCase()
      : ''
    const password = typeof request.body?.password === 'string'
      ? request.body.password
      : ''
    const ipAddress = request.ip

    if (isLoginRateLimited(ipAddress)) {
      return response.status(429).json({
        error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.',
      })
    }

    if (
      !isValidAdminUsername(username)
      || !password
      || password.length > 256
    ) {
      recordFailedLogin(ipAddress)
      return response.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, usuario, password_salt, password_hash
         FROM public.admin_usuario
         WHERE usuario = $1`,
        [username],
      )
      const admin = rows[0]
      if (!admin || !(await verifyPassword(password, admin.password_salt, admin.password_hash))) {
        recordFailedLogin(ipAddress)
        return response.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
      }

      failedLogins.delete(ipAddress)
      const token = randomBytes(32).toString('hex')
      const tokenHash = hashToken(token)
      const expiresAt = new Date(Date.now() + sessionDurationMs)
      await pool.query('DELETE FROM public.admin_sesion WHERE expira_en <= NOW()')
      await pool.query(
        `INSERT INTO public.admin_sesion (token_hash, usuario_id, expira_en)
         VALUES ($1, $2, $3)`,
        [tokenHash, admin.id, expiresAt],
      )
      setSessionCookie(response, token)
      return response.json({ usuario: admin.usuario })
    } catch (error) {
      return next(error)
    }
  })

  router.use(async (request, response, next) => {
    const token = getSessionToken(request)
    if (!token) return response.status(401).json({ error: 'Inicia sesión para continuar.' })

    try {
      const tokenHash = hashToken(token)
      const { rows } = await pool.query(
        `SELECT u.id, u.usuario
         FROM public.admin_sesion s
         JOIN public.admin_usuario u ON u.id = s.usuario_id
         WHERE s.token_hash = $1 AND s.expira_en > NOW()`,
        [tokenHash],
      )
      if (!rows[0]) {
        clearSessionCookie(response)
        return response.status(401).json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' })
      }
      request.admin = rows[0]
      request.adminSessionHash = tokenHash
      return next()
    } catch (error) {
      return next(error)
    }
  })

  router.get('/session', (request, response) => {
    return response.json({ usuario: request.admin.usuario })
  })

  router.post('/logout', async (request, response, next) => {
    try {
      await pool.query('DELETE FROM public.admin_sesion WHERE token_hash = $1', [
        request.adminSessionHash,
      ])
      clearSessionCookie(response)
      return response.sendStatus(204)
    } catch (error) {
      return next(error)
    }
  })

  router.get('/prospectos', async (request, response, next) => {
    const pageValue = Number(request.query.pagina || 1)
    const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1
    const pageSize = 25
    const search = typeof request.query.buscar === 'string'
      ? request.query.buscar.trim().slice(0, 150)
      : ''
    const searchPattern = `%${search}%`

    try {
      const filter = `($1 = '' OR
        nombre ILIKE $2 OR apellido ILIKE $2 OR email ILIKE $2 OR
        telefono ILIKE $2 OR nombre_proyecto ILIKE $2 OR nicho ILIKE $2)`
      const [countResult, prospectResult] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::integer AS total
           FROM public.prospecto
           WHERE ${filter}`,
          [search, searchPattern],
        ),
        pool.query(
          `SELECT id, nombre, apellido, email, telefono, nombre_proyecto, nicho,
                  descripcion, archivo_ruta, archivo_nombre, creado_en
           FROM public.prospecto
           WHERE ${filter}
           ORDER BY creado_en DESC, id DESC
           LIMIT $3 OFFSET $4`,
          [search, searchPattern, pageSize, (page - 1) * pageSize],
        ),
      ])
      const total = countResult.rows[0].total
      return response.json({
        prospectos: prospectResult.rows,
        total,
        pagina: page,
        paginas: Math.max(1, Math.ceil(total / pageSize)),
      })
    } catch (error) {
      return next(error)
    }
  })

  router.get('/prospectos/:id/archivo', async (request, response, next) => {
    if (!/^\d+$/.test(request.params.id)) {
      return response.status(404).json({ error: 'No encontramos el archivo solicitado.' })
    }

    try {
      const { rows } = await pool.query(
        `SELECT archivo_ruta, archivo_nombre
         FROM public.prospecto
         WHERE id = $1 AND archivo_ruta IS NOT NULL`,
        [request.params.id],
      )
      const file = rows[0]
      if (
        !file
        || !/^[a-f0-9-]{36}\.(pdf|jpg|png|webp)$/.test(file.archivo_ruta)
      ) {
        return response.status(404).json({ error: 'No encontramos el archivo solicitado.' })
      }

      const filePath = path.join(uploadDirectory, file.archivo_ruta)
      await access(filePath)
      return response.download(filePath, file.archivo_nombre || 'adjunto', (error) => {
        if (error && !response.headersSent) next(error)
      })
    } catch (error) {
      if (error.code === 'ENOENT') {
        return response.status(404).json({ error: 'El archivo adjunto ya no está disponible.' })
      }
      return next(error)
    }
  })

  return router
}
