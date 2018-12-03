const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, params) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  const app = access.workspaces[params.app]
  app.name = params.name
  access.setApp(params.app, app)
  socket.send('app_renamed')
}
