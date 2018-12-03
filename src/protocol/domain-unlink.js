const access = require('../access')
const tokens = require('../tokens')

module.exports = (socket, domain) => {
  if (!socket.token) return socket.send('error', 'No token supplied')
  const payload = tokens.verify(socket.token)
  if (!payload || !payload.userId) return socket.send('error', 'Token invalid')
  if (!access.domains[domain])
    return socket.send('error', 'Domain not in use')
  if (!access.perm.hasparent(`app:${access.domains[domain]}`, `user:${payload.userId}`))
    return socket.send('error', 'No access to app')
  access.permRemove(`domain:${domain}`, `app:${access.domains[domain]}`)
  access.delDomain(domain)
  socket.send('domain_unlink_complete')
}
