const ivm = require('isolated-vm')
const axios = require('axios')
const hub = require('odo-hub')
const access = require('./access')
const bridge = require('./bridge')
const instances = {}

const create = (app) => {
  console.log('creating', app.appId)
  let code = app.code
  const incoming = hub()
  const outgoing = hub()
  let isolate = null
  let internal = null
  const result = {
    appId: app.appId,
    on: outgoing.on,
    off: outgoing.off,
    emit: incoming.emit,
    start: () => {
      console.log('starting', app.appId)
      isolate = new ivm.Isolate()
      internal = hub()
      isolate.createContext().then((context) => {
        return Promise.all([
          context.global.set('global', context.global.derefInto()),
          context.global.set('_ivm', ivm)
        ])
        .then(() => bridge({
          isolate, context,
          internal, incoming, outgoing,
          app, code
        }))
        .then(() => isolate.compileScript('delete _ivm'))
        .then((script) => script.run(context))
        .then(() => isolate.compileScript(code))
        .then((script) => script.run(context))
      })
      .catch(err => {
        if (err.stack) return outgoing.emit('error', err.stack)
        outgoing.emit('error', err.toString())
      })
    },
    stop: () => {
      if (!isolate) return
      console.log('stopping', app.appId)
      incoming.unhandledOff(internal.emit)
      internal = null
      if (!isolate.isDisposed) isolate.dispose()
      isolate = null
    },
    update: (app) => {
      result.stop()
      console.log('updating', app.appId)
      code = app.code
      result.start()
    }
  }
  return result
}

module.exports = {
  open: () => Promise.resolve(Object.values(access.apps)
    .filter((app) => !app.disabled)
    .forEach(module.exports.run)),
  close: () =>
    Promise.resolve(Object.keys(instances).forEach(module.exports.stop)),
  enable: (appId) => {
    if (instances[appId]) return
    const app = access.apps[appId]
    delete app.disabled
    access.setApp(appId, app)
    module.exports.run(app)
  },
  disable: (appId) => {
    if (!instances[appId]) return
    instances[appId].stop()
    delete instances[appId]
    const app = access.apps[appId]
    app.disabled = true
    access.setApp(appId, app)
  },
  delete: (appId) => {
    if (!instances[appId]) return
    instances[appId].stop()
    delete instances[appId]
    access.delApp(appId)
    console.log('deleting', appId)
  },
  run: (app) => {
    if (instances[app.appId]) return instances[app.appId].update(app)
    const instance = create(app)
    instances[app.appId] = instance
    instance.start()
  },
  start: (appId) => { if (instances[appId]) instances[appId].start()},
  stop: (appId) => { if (instances[appId]) instances[appId].stop()},
  update: (app) => { if (instances[app.appId]) instances[appId].update(app)},
  on: (appId, e, cb) => { if (instances[appId]) instances[appId].on(e, cb)},
  off: (appId, e, cb) => { if (instances[appId]) instances[appId].off(e, cb)},
  emit: (appId, e, ...args) => {
    if (instances[appId]) instances[appId].emit(e, ...args)
  }
}