const access = require('../access')
const isolate = require('../isolate')
const tokens = require('../tokens')

module.exports = (socket) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  const result = {
    userId: payload.userId,
    emailAddresses: [],
    workspaces: []
  }
  for (let child of access.perm.children(`user:${payload.userId}`)) {
    if (child.indexOf('email:') == 0)
      result.emailAddresses.push(child.split(':')[1])
    if (child.indexOf('workspace:') == 0) {
      const workspaceId = child.split(':')[1]
      if (!access.workspaces[workspaceId]) continue
      const workspace = {
        workspaceId: workspaceId,
        name: access.workspaces[workspaceId].name,
        apps: []
      }
      for (let workspaceChild of access.perm.children(child)) {
        if (workspaceChild.indexOf('app:') != 0) continue
        const appId = workspaceChild.split(':')[1]
        if (!access.apps[appId]) continue
        const app = access.apps[appId]
        const appRes = {
          appId: appId,
          name: app.name,
          disabled: app.disabled,
          domains: []
        }
        for (let appChild of access.perm.children(workspaceChild)) {
          if (appChild.indexOf('domain:') != 0) continue
          const domain = appChild.split(':')[1]
          appRes.domains.push(domain)
        }
        workspace.apps.push(appRes)
      }
      result.workspaces.push(workspace)
    }
  }
  socket.send('status', result)
}
