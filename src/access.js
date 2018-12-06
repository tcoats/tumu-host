const db = require('level')(`${process.cwd()}/.tumu-data/access`)

const toid = (from, to) =>
  `${encodeURIComponent(from)}/${encodeURIComponent(to)}`
const fromid = (id) => id.split('/').map(decodeURIComponent)

const loadAll = (prefix) => new Promise((resolve, reject) => {
  const result = {}
  db
    .createReadStream({ gt: `${prefix}:`, lt: `${prefix}:\xff` })
    .on('data', (data) => {
      try {
        result[data.key.slice(prefix.length + 1)] = JSON.parse(data.value)
      } catch (err) {
        result[data.key.slice(prefix.length + 1)] = true
      }
    })
    .on('error', reject)
    .on('end', () => resolve(result))
})
const writeOne = (prefix, key, value) =>
  db.put(`${prefix}:${key}`, JSON.stringify(value))
const delOne = (prefix, key) => db.del(`${prefix}:${key}`)

const perm = require('perm')()

const result = {
  open: () => Promise.all([
    loadAll('user').then((users) => result.users = users ),
    loadAll('email').then((emails) => result.emails = emails),
    loadAll('app').then((apps) => result.apps = apps),
    loadAll('domain').then((domains) => result.domains = domains),
    loadAll('workspace').then((workspaces) => result.workspaces = workspaces),
    loadAll('membership').then((membership) =>
      Object.keys(membership).forEach((key) => {
        const [from, to] = fromid(key)
        perm.add(from, to)
      })),
    loadAll('permission').then((permissions) =>
      Object.keys(permissions).forEach((key) => {
        const [from, to] = fromid(key)
        perm.allow(from, to)
      }))
  ]),
  close: () => Promise.resolve(),
  perm: perm,
  permAdd: (from, to) => {
    writeOne('membership', toid(from, to))
    perm.add(from, to)
  },
  permRemove: (from, to) => {
    delOne('membership', toid(from, to))
    perm.remove(from, to)
  },
  permAllow: (from, to) => {
    writeOne('permission', toid(from, to))
    perm.allow(from, to)
  },
  permDisallow: (from, to) => {
    delOne('permission', toid(from, to))
    perm.disallow(from, to)
  },

  users: {},
  setUser: (id, user) => writeOne('user', id, result.users[id] = user),
  delUser: (id) => {
    delOne('user', id)
    delete result.users[id]
  },

  emails: {},
  emailSecrets: {},
  setEmail: (emailAddress, userId) =>
    writeOne('email', emailAddress, result.emails[emailAddress] = userId),
  delEmail: (emailAddress) => {
    delOne('email', emailAddress)
    delete result.emails[emailAddress]
  },

  apps: {},
  setApp: (id, app) => writeOne('app', id, result.apps[id] = app),
  delApp: (id) => {
    delOne('app', id)
    delete result.apps[id]
  },

  domains: {},
  setDomain: (domain, app) =>
    writeOne('domain', domain, result.domains[domain] = app),
  delDomain: (domain) => {
    delOne('domain', domain)
    delete result.domains[domain]
  },

  workspaces: {},
  setWorkspace: (id, workspace) =>
    writeOne('workspace', id, result.workspaces[id] = workspace),
  delWorkspace: (id) => {
    delOne('workspace', id)
    delete result.workspaces[id]
  }
}
module.exports = result
