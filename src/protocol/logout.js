const access = require('../access')

module.exports = (socket, params) => {
  if (!access.emails[params.emailAddress]) return socket.send('logout')
  const userId = access.emails[params.emailAddress]
  const user = access.users[userId]
  if (user.tokens[params.token]) {
    delete user.tokens[params.token]
    access.setUser(userId, user)
  }
  socket.send('logout_complete')
}