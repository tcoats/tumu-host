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

const result = {
  load: () => Promise.all([
    loadAll('user').then((users) => result.users = users ),
    loadAll('email').then((emails) => result.emails = emails),
    loadAll('app').then((apps) => result.apps = apps)
  ]),
  users: {},
  setUser: (id, user) => {
    result.users[id] = user
    db.put(`user:${id}`, JSON.stringify(user))
  },
  emails: {},
  setEmail: (emailAddress, userId) => {
    result.emails[emailAddress] = userId
    db.put(`email:${emailAddress}`, JSON.stringify(userId))
  },
  apps: {},
  setApp: (id, app) => {
    result.apps[id] = app
    db.put(`app:${id}`, JSON.stringify(app))
  }
}
module.exports = result
