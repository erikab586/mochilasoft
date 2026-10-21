const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,63}$/
const emailPattern = /^[a-z0-9][a-z0-9._+-]*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/

export function isValidAdminUsername(username) {
  if (typeof username !== 'string' || username.length > 64) return false
  return usernamePattern.test(username) || emailPattern.test(username)
}
