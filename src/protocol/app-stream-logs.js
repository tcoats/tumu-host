const access = require('../access')
const tokens = require('../tokens')
const isolate = require('../isolate')

module.exports = (socket, app) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!app) return socket.send('error', 'App not specified')
  if (!access.apps[app]) return socket.send('error', 'App not found')
  const log = (...args) => {
    if (socket.isclosed) return isolate.off(app, 'log', log)
    socket.send('app_log_message', args)
  }
  isolate.on(app, 'log', log)
  const error = (...args) => {
    if (socket.isclosed) return isolate.off(app, 'error', error)
    socket.send('error', args)
  }
  isolate.on(app, 'app_error_message', error)
}
