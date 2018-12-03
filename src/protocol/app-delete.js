const access = require('../access')
const tokens = require('../tokens')
const isolate = require('../isolate')

module.exports = (socket, app) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!app) return socket.send('error', 'App not specified')
  if (!access.apps[app]) return socket.send('error', 'App not found')
  const permKey = `app:${app}`
  if (!access.perm.hasparent(permKey, `user:${payload.userId}`))
    return socket.send('error', 'No access to app')
  isolate.delete(app)
  for (let child of access.perm.children(permKey))
    access.permRemove(permKey, child)
  for (let parent of access.perm.parents(permKey))
    access.permRemove(parent, permKey)
  socket.send('app_delete_complete')
}
