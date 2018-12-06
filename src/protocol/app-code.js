const access = require('../access')
const tokens = require('../tokens')
const isolate = require('../isolate')

module.exports = (socket, app) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!app) return socket.send('error', 'App not specified')
  if (!access.apps[app]) return socket.send('error', 'App not found')
  if (!access.perm.hasparent(`app:${app}`, `user:${payload.userId}`))
    return socket.send('error', 'No access to app')
  socket.send('app_code_complete', access.apps[app].code)
}
