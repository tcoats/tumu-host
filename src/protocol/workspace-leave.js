const access = require('../access')
const tokens = require('../tokens')
const isolate = require('../isolate')

module.exports = (socket, workspace) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!workspace) return socket.send('error', 'Workspace not specified')
  if (!access.workspaces[workspace])
    return socket.send('error', 'Workspace not found')
  const permKey = `workspace:${workspace}`
  if (!access.perm.hasparent(permKey, `user:${payload.userId}`))
    return socket.send('error', 'No access to workspace')
  access.permRemove(permKey, `user:${payload.userId}`)
  if (access.perm.parents(permKey).length == 0) {
    for (let child of access.perm.children(permKey)) {
      access.permRemove(permKey, child)
      if (child.indexOf('app:') == 0) isolate.delete(child.split(':')[1])
    }
    for (let parent of access.perm.parents(permKey))
      access.permRemove(parent, permKey)
    access.delWorkspace(workspace)
  }
  socket.send('workspace_leave_complete')
}
