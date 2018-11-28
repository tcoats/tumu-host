const db = require('level')(__dirname + '/../.data/access')

const loadAll = (prefix) => new Promise((resolve, reject) => {
  const result = {}
  db
    .createReadStream({ gt: `${prefix}:`, lt: `${prefix}:\xff` })
    .on('data', (data) => {
      result[data.key.slice(prefix.length + 1)] = JSON.parse(data.value)
    })
    .on('error', reject)
    .on('end', () => resolve(result))
})
const writeOne = (prefix, key, value) =>
  db.put(`${prefix}:${key}`, JSON.stringify(value))

const result = {
  open: () => Promise.all([
    loadAll('user').then((users) => result.users = users ),
    loadAll('email').then((emails) => result.emails = emails),
    loadAll('app').then((apps) => result.apps = apps)
  ]),
  close: () => { },
  users: {},
  setUser: (id, user) => {
    result.users[id] = user
    writeOne('user', id, user)
  },
  emails: {},
  setEmail: (emailAddress, userId) => {
    result.emails[emailAddress] = userId
    writeOne('email', emailAddress, userId)
  },
  apps: {},
  setApp: (id, app) => {
    result.apps[id] = app
    writeOne('app', id, app)
  }
}
module.exports = result
