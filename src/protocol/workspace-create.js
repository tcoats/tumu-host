const uuid = require('uuid/v4')
const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, params) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  const workspaceId = uuid()
  const workspace = {
    workspaceId: workspaceId,
    userId: payload.userId,
    name: params.name
  }
  access.setWorkspace(workspaceId, workspace)
  access.permAdd(`workspace:${workspaceId}`, `user:${payload.userId}`)
  socket.send('workspace_created', workspaceId)
}
