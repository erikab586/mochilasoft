import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidAdminUsername } from './admin-username.js'

test('accepts the requested email usernames and existing username format', () => {
  assert.equal(isValidAdminUsername('erikabritooficial@gmail.com'), true)
  assert.equal(isValidAdminUsername('rebeca.quevedo08@gmail.com'), true)
  assert.equal(isValidAdminUsername('admin-test'), true)
})

test('rejects malformed or overlong admin usernames', () => {
  assert.equal(isValidAdminUsername('not-an-email@'), false)
  assert.equal(isValidAdminUsername('ab'), false)
  assert.equal(isValidAdminUsername(`a${'b'.repeat(64)}`), false)
})
