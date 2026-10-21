import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from './admin-password.js'

test('hashes passwords with unique salts and verifies the password', async () => {
  const password = 'MochilaSoft admin passphrase'
  const first = await hashPassword(password)
  const second = await hashPassword(password)

  assert.notEqual(first.salt, second.salt)
  assert.notEqual(first.hash, second.hash)
  assert.equal(await verifyPassword(password, first.salt, first.hash), true)
  assert.equal(await verifyPassword('incorrecta', first.salt, first.hash), false)
  assert.equal(await verifyPassword(password, 'invalid', first.hash), false)
})
