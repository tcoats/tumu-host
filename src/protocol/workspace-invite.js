const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, params) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!params.workspace) return socket.send('error', 'Workspace not specified')
  if (!access.workspaces[params.workspace])
    return socket.send('error', 'Workspace not found')
  if (!params.emailAddress)
    return socket.send('error', 'Email address not specified')
  if (!access.emails[params.emailAddress])
    return socket.send('error', 'Email address not found')
  access.permAdd(`workspace:${params.workspace}`, `user:${access.emails[params.emailAddress]}`)
  socket.send('workspace_invite_complete')
}
