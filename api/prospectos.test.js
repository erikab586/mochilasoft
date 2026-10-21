import test from 'node:test'
import assert from 'node:assert/strict'
import { detectFileType, normalizeProspect } from './prospectos.js'

const validProspect = {
  nombre: ' Ana ',
  apellido: '',
  email: '',
  telefono: '+55 48 98878-7190',
  nombre_proyecto: ' Sitio web ',
  nicho: '',
  descripcion: '',
}

test('normalizes a prospect with required fields and optional values', () => {
  assert.deepEqual(normalizeProspect(validProspect), {
    prospect: {
      nombre: 'Ana',
      apellido: null,
      email: null,
      telefono: '+5548988787190',
      nombreProyecto: 'Sitio web',
      nicho: null,
      descripcion: null,
    },
  })
})

test('requires name, international phone number, and project name', () => {
  assert.match(normalizeProspect({ ...validProspect, nombre: '' }).error, /nombre, teléfono/)
  assert.match(normalizeProspect({ ...validProspect, telefono: '12345' }).error, /código de país/)
  assert.match(normalizeProspect({ ...validProspect, nombre_proyecto: '' }).error, /nombre, teléfono/)
})

test('validates email and field lengths', () => {
  assert.match(normalizeProspect({ ...validProspect, email: 'bad-email' }).error, /email válida/)
  assert.match(normalizeProspect({ ...validProspect, descripcion: 'x'.repeat(5001) }).error, /longitud permitida/)
})

test('recognizes allowed file signatures, not filenames', () => {
  assert.equal(detectFileType(Buffer.from('%PDF-1.7')).mimeType, 'application/pdf')
  assert.equal(detectFileType(Buffer.from([0xff, 0xd8, 0xff, 0x00])).mimeType, 'image/jpeg')
  assert.equal(
    detectFileType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).mimeType,
    'image/png',
  )
  assert.equal(detectFileType(Buffer.from('RIFF0000WEBP')).mimeType, 'image/webp')
  assert.equal(detectFileType(Buffer.from('not an image')), null)
})
