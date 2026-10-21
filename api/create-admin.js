import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { hashPassword } from './admin-password.js'
import { isValidAdminUsername } from './admin-username.js'
import { pool } from './database.js'

async function readHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Ejecuta este comando desde una terminal interactiva para ingresar la contraseña de forma segura.')
  }

  stdout.write(prompt)
  stdin.setRawMode(true)
  stdin.resume()

  return new Promise((resolve, reject) => {
    let value = ''
    const cleanup = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      stdout.write('\r\n')
    }
    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          cleanup()
          reject(new Error('Operación cancelada.'))
          return
        }
        if (character === '\r' || character === '\n') {
          cleanup()
          resolve(value)
          return
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1)
        } else if (character >= ' ') {
          value += character
        }
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  if (!stdin.isTTY) {
    throw new Error('Ejecuta npm run admin:create desde una terminal interactiva.')
  }

  const prompt = readline.createInterface({ input: stdin, output: stdout })
  const username = (await prompt.question('Usuario nuevo (3-64 caracteres): '))
    .trim()
    .toLowerCase()
  prompt.close()

  if (!isValidAdminUsername(username)) {
    throw new Error('Ingresa un usuario válido o un correo electrónico de hasta 64 caracteres.')
  }

  const password = await readHidden('Contraseña nueva (mínimo 12 caracteres): ')
  const confirmation = await readHidden('Repite la contraseña: ')
  if (password.length < 12 || password.length > 256) {
    throw new Error('La contraseña debe tener entre 12 y 256 caracteres.')
  }
  if (password !== confirmation) {
    throw new Error('Las contraseñas no coinciden.')
  }

  const { salt, hash } = await hashPassword(password)
  await pool.query(
    `INSERT INTO public.admin_usuario (usuario, password_salt, password_hash)
     VALUES ($1, $2, $3)`,
    [username, salt, hash],
  )
  console.log(`Cuenta de administrador "${username}" creada.`)
}

try {
  await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
