const speakeasy = require('speakeasy')
const access = require('../access')

module.exports = (socket, emailAddress) => {
  // auto signup
  // TODO: email validation?
  if (!access.emails[emailAddress]) {
    const secret = speakeasy.generateSecret()
    socket.secret = secret.base32
    socket.send('login_secret_generated', socket.secret)
    return
  }
  socket.send('login_challenge')
}
