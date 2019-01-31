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
  const userIds = {}
  for (let parent of access.perm.parents(permKey))
    if (parent.indexOf('user:') == 0)
      userIds[parent.split(':')[1]] = true
  socket.send('workspace_status_complete', {
    users: Object.keys(userIds).map((id) => {
      if (!access.users[id]) {
        console.log(access.users)
        console.log(id)
      }
      return {
        userId: id,
        emailAddress: access.users[id].emailAddress
      }
    })
  })
}
