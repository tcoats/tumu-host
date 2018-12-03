const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, params) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!params.workspace) return socket.send('error', 'Workspace not specified')
  if (!access.workspaces[params.workspace])
    return socket.send('error', 'Workspace not found')
  if (!access.perm.hasparent(`workspace:${params.workspace}`, `user:${payload.userId}`))
    return socket.send('error', 'No access to workspace')
  const workspace = access.workspaces[params.workspace]
  workspace.name = params.name
  access.setWorkspace(params.workspace, workspace)
  socket.send('workspace_renamed')
}
