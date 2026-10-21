import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import multer from 'multer'

const allowedFileTypes = new Map([
  ['pdf', { mimeType: 'application/pdf', extension: 'pdf' }],
  ['jpeg', { mimeType: 'image/jpeg', extension: 'jpg' }],
  ['png', { mimeType: 'image/png', extension: 'png' }],
  ['webp', { mimeType: 'image/webp', extension: 'webp' }],
])

const stringField = (body, name) => {
  const value = body?.[name]
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeProspect(body) {
  const nombre = stringField(body, 'nombre')
  const apellido = stringField(body, 'apellido')
  const email = stringField(body, 'email')
  const telefonoIngresado = stringField(body, 'telefono')
  const telefono = telefonoIngresado.replace(/[\s().-]/g, '')
  const nombreProyecto = stringField(body, 'nombre_proyecto')
  const nicho = stringField(body, 'nicho')
  const descripcion = stringField(body, 'descripcion')

  if (!nombre || !telefono || !nombreProyecto) {
    return { error: 'Completa nombre, teléfono y nombre del proyecto.' }
  }
  if (
    nombre.length > 100
    || apellido.length > 100
    || email.length > 190
    || telefono.length > 16
    || nombreProyecto.length > 150
    || nicho.length > 150
    || descripcion.length > 5000
  ) {
    return { error: 'Uno o más campos superan la longitud permitida.' }
  }
  if (!/^\+[1-9]\d{6,14}$/.test(telefono)) {
    return { error: 'Ingresa el teléfono con código de país, por ejemplo +55 48 98878-7190.' }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Ingresa una dirección de email válida.' }
  }

  return {
    prospect: {
      nombre,
      apellido: apellido || null,
      email: email || null,
      telefono,
      nombreProyecto,
      nicho: nicho || null,
      descripcion: descripcion || null,
    },
  }
}

export function detectFileType(buffer) {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return allowedFileTypes.get('pdf')
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return allowedFileTypes.get('jpeg')
  }
  if (
    buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return allowedFileTypes.get('png')
  }
  if (
    buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return allowedFileTypes.get('webp')
  }
  return null
}

const safeOriginalFileName = (name) => {
  const basename = path.posix.basename(String(name).replaceAll('\\', '/'))
  const sanitized = basename.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255)
  return sanitized || 'archivo'
}

export function createProspectRouter({ pool, uploadDirectory, maxUploadBytes }) {
  const router = express.Router()
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxUploadBytes,
      files: 1,
      fields: 8,
      fieldSize: 6000,
      parts: 9,
    },
  })

  router.post('/', (request, response, next) => {
    upload.single('archivo')(request, response, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return response.status(422).json({ error: 'El archivo supera el tamaño permitido de 5 MB.' })
        }
        return response.status(422).json({ error: 'No se pudo recibir el archivo. Comprueba el archivo adjunto e intenta nuevamente.' })
      }
      if (error) return next(error)

      void saveProspect(request, response, next)
    })
  })

  async function saveProspect(request, response, next) {
    if (stringField(request.body, 'website')) {
      return response.status(422).json({ error: 'No se pudo validar la solicitud.' })
    }

    const normalized = normalizeProspect(request.body)
    if (normalized.error) {
      return response.status(422).json({ error: normalized.error })
    }

    const file = request.file
    let savedFilePath = null
    let storedFileName = null
    let originalFileName = null

    if (file) {
      if (file.size < 1 || file.size > maxUploadBytes) {
        return response.status(422).json({ error: 'El archivo debe pesar menos de 5 MB.' })
      }
      const fileType = detectFileType(file.buffer)
      if (!fileType) {
        return response.status(422).json({ error: 'Adjunta un PDF, JPG, PNG o WebP válido.' })
      }

      storedFileName = `${randomUUID()}.${fileType.extension}`
      originalFileName = safeOriginalFileName(file.originalname)
      savedFilePath = path.join(uploadDirectory, storedFileName)

      try {
        await mkdir(uploadDirectory, { recursive: true, mode: 0o750 })
        await writeFile(savedFilePath, file.buffer, { flag: 'wx', mode: 0o640 })
      } catch (error) {
        return next(error)
      }
    }

    try {
      const { prospect } = normalized
      await pool.query(
        `INSERT INTO public.prospecto
          (nombre, apellido, email, telefono, nombre_proyecto, nicho, descripcion, archivo_ruta, archivo_nombre)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          prospect.nombre,
          prospect.apellido,
          prospect.email,
          prospect.telefono,
          prospect.nombreProyecto,
          prospect.nicho,
          prospect.descripcion,
          storedFileName,
          originalFileName,
        ],
      )
    } catch (error) {
      if (savedFilePath) {
        try {
          await unlink(savedFilePath)
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') {
            console.error('Could not remove an uploaded prospect file after a database error.', cleanupError)
          }
        }
      }
      return next(error)
    }

    return response.status(201).json({
      message: '¡Gracias! Recibimos tu proyecto y pronto nos pondremos en contacto.',
    })
  }

  return router
}
