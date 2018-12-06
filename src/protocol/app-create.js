const aaa = require('adjective-adjective-animal')
const access = require('../access')
const tokens = require('../tokens')
const isolate = require('../isolate')

module.exports = (socket, params) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!params.workspace) return socket.send('error', 'Workspace not specified')
  if (!access.workspaces[params.workspace])
    return socket.send('error', 'Workspace not found')
  const workspacePermKey = `workspace:${params.workspace}`
  if (!access.perm.hasparent(workspacePermKey, `user:${payload.userId}`))
    return socket.send('error', 'No access to workspace')
  aaa().then((appId) => {
    const app = {
      appId: appId,
      name: params.name,
      code: ''
    }
    access.setApp(appId, app)
    access.permAdd(`app:${appId}`, workspacePermKey)
    isolate.enable(appId)
    socket.send('app_created', appId)
  })
}
