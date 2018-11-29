const speakeasy = require('speakeasy')
const uuid = require('uuid/v4')
const aaa = require('adjective-adjective-animal')
const access = require('./access')
const tokens = require('./tokens')
const isolate = require('./isolate')

module.exports = {
  login: (socket, emailAddress) => {
    // auto signup
    // TODO: email validation?
    if (!access.emails[emailAddress]) {
      socket.secret = speakeasy.generateSecret().base32
      socket.send('secret', socket.secret)
      return
    }
    socket.send('challenge')
  },
  code: (socket, params) => {
    if (!access.emails[params.emailAddress]) {
      if (!socket.secret)
        return socket.send('error', 'No secret has been generated')
      if (!speakeasy.totp.verify({
        secret: socket.secret,
        encoding: 'base32',
        token: params.code,
        window: 2
      })) return socket.send('error', 'Code failed verification')
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
    if (!access.emails[params.emailAddress]) return socket.send('logout')
    const userId = access.emails[params.emailAddress]
    const user = access.users[userId]
    if (user.tokens[params.token]) {
      delete user.tokens[params.token]
      access.setUser(userId, user)
    }
    socket.send('logout')
  },
  new: (socket) => {
    if (!socket.token) return socket.send('error', 'No token supplied')
    const payload = tokens.verify(socket.token)
    if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
    aaa().then((appId) => {
      const app = {
        appId: appId,
        userId: payload.userId,
        code: ''
      }
      access.setApp(appId, app)
      socket.send('new', appId)
    })
  },
  domain: (socket, params) => {
    if (!socket.token) return socket.send('error', 'No token supplied')
    const payload = tokens.verify(socket.token)
    if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
    if (!params.app) return socket.send('error', 'App not specified')
    if (!access.apps[params.app]) return socket.send('error', 'App not found')
    access.setDomain(params.domain, params.app)
    socket.send('domain')
  },
  enable: (socket, app) => {
    if (!socket.token) return socket.send('error', 'No token supplied')
    const payload = tokens.verify(socket.token)
    if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
    if (!app) return socket.send('error', 'App not specified')
    if (!access.apps[app]) return socket.send('error', 'App not found')
    isolate.enable(app)
    socket.send('enable')
  },
  disable: (socket, app) => {
    if (!socket.token) return socket.send('error', 'No token supplied')
    const payload = tokens.verify(socket.token)
    if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
    if (!app) return socket.send('error', 'App not specified')
    if (!access.apps[app]) return socket.send('error', 'App not found')
    isolate.disable(app)
    socket.send('disable')
  },
  publish: (socket, params) => {
    if (!socket.token) return socket.send('error', 'No token supplied')
    const payload = tokens.verify(socket.token)
    if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
    if (!params.app) return socket.send('error', 'App not specified')
    if (!access.apps[params.app]) return socket.send('error', 'App not found')
    const app = access.apps[params.app]
    app.code = params.code
    access.setApp(params.app, app)
    isolate.run(app)
    socket.send('publish')
  },
  logs: (socket, app) => {
    if (!socket.token) return socket.send('error', 'No token supplied')
    const payload = tokens.verify(socket.token)
    if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
    if (!app) return socket.send('error', 'App not specified')
    if (!access.apps[app]) return socket.send('error', 'App not found')
    const log = (...args) => {
      if (socket.isclosed) return isolate.off(app, 'log', log)
      socket.send('log', args)
    }
    isolate.on(app, 'log', log)
    const error = (...args) => {
      if (socket.isclosed) return isolate.off(app, 'error', error)
      socket.send('error', args)
    }
    isolate.on(app, 'error', error)
  }
}
