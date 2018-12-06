const uuid = require('uuid/v4')
const speakeasy = require('speakeasy')
const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, params) => {
  if (!access.emails[params.emailAddress]) {
    const secret = socket.secret || access.emailSecrets[params.emailAddress]
    if (!secret)
      return socket.send('login_failure', 'No secret has been generated')
    if (!speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: params.code,
      window: 2
    })) return socket.send('login_failure', 'Code failed verification')
    const userId = uuid()
    const token = tokens.sign({
      userId: userId,
      emailAddress: params.emailAddress
    })
    const user = {
      userId: userId,
      emailAddress: params.emailAddress,
      secret: secret,
      tokens: {}
    }
    user.tokens[token] = true
    access.setUser(userId, user)
    access.setEmail(params.emailAddress, userId)
    access.permAdd(`user:${userId}`, `email:${params.emailAddress}`)
    return socket.send('login_complete', token)
  }
  const userId = access.emails[params.emailAddress]
  const user = access.users[userId]
  const token = tokens.sign({
    userId: userId,
    emailAddress: params.emailAddress
  })
  user.tokens[token] = true
  access.setUser(userId, user)
  return socket.send('login_complete', token)
}
