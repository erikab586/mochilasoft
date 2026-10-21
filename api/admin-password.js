import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const saltLength = 16
const hashLength = 64

export async function hashPassword(password) {
  const salt = randomBytes(saltLength)
  const hash = await scrypt(password, salt, hashLength)
  return { salt: salt.toString('hex'), hash: hash.toString('hex') }
}

export async function verifyPassword(password, saltHex, hashHex) {
  if (
    typeof saltHex !== 'string'
    || typeof hashHex !== 'string'
    || !/^[a-f0-9]{32}$/i.test(saltHex)
    || !/^[a-f0-9]{128}$/i.test(hashHex)
  ) {
    return false
  }

  const expectedHash = Buffer.from(hashHex, 'hex')
  const actualHash = await scrypt(password, Buffer.from(saltHex, 'hex'), hashLength)
  return timingSafeEqual(actualHash, expectedHash)
}
