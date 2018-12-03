const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, params) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!params.app) return socket.send('error', 'App not specified')
  if (!access.apps[params.app]) return socket.send('error', 'App not found')
  if (access.domains[params.domain]) return socket.send('error', 'Domain in use')
  if (!access.perm.hasparent(`app:${params.app}`, `user:${payload.userId}`))
    return socket.send('error', 'No access to app')
  access.setDomain(params.domain, params.app)
  access.permAdd(`domain:${params.domain}`, `app:${params.app}`)
  socket.send('domain_link_complete')
}
