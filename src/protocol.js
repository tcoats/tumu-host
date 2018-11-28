const speakeasy = require('speakeasy')

const access = require('./access')
const tokens = require('./tokens')
const uuid = require('uuid/v4');

module.exports = {
  login: (socket, emailAddress) => {
    console.log(emailAddress)
    console.log(access.emails)
    if (!access.emails[emailAddress]) {
      socket.secret = speakeasy.generateSecret().base32
      socket.send('secret', socket.secret)
      return
    }
    socket.send('challenge', null)
  },
  code: (socket, params) => {
    if (!access.emails[params.emailAddress]) {
      if (!socket.secret) return socket.send('failed', null)
      if (!speakeasy.totp.verify({
        secret: socket.secret,
        encoding: 'base32',
        token: params.code,
        window: 2
      })) return socket.send('failed', null)
      const userId = uuid()
      const token = tokens.sign({
        userId: userId,
        emailAddress: params.emailAddress
      })
      const user = {
        userId: userId,
        emailAddress: params.emailAddress,
        secret: socket.secret,
        tokens: {}
      }
      user.tokens[token] = true
      access.setUser(userId, user)
      access.setEmail(params.emailAddress, userId)
      return socket.send('login', token)
    }
    const userId = access.emails[params.emailAddress]
    const user = access.users[userId]
    const token = tokens.sign({
      userId: userId,
      emailAddress: params.emailAddress
    })
    user.tokens[token] = true
    access.setUser(userId, user)
    return socket.send('login', token)
  },
  logout: (socket, params) => {
    if (!access.emails[params.emailAddress]) return socket.send('logout', null)
    const userId = access.emails[params.emailAddress]
    const user = access.users[userId]
    if (user.tokens[params.token]) {
      delete user.tokens[params.token]
      access.setUser(userId, user)
    }
    socket.send('logout', null)
  },
  new: (socket, params) => {
    socket.send('new', null)
  },
  publish: (socket, params) => {
    socket.send('publish', null)
  },
  logs: (socket, params) => {
    socket.send('logs', null)
  }
}
