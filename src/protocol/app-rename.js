const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, params) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!params.app) return socket.send('error', 'App not specified')
  if (!access.apps[params.app]) return socket.send('error', 'App not found')
  if (!access.perm.hasparent(`app:${params.app}`, `user:${payload.userId}`))
    return socket.send('error', 'No access to app')
  const app = access.workspaces[params.app]
  app.name = params.name
  access.setApp(params.app, app)
  socket.send('app_renamed')
}
