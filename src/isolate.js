const ivm = require('isolated-vm')
const axios = require('axios')
const hub = require('odo-hub')
const access = require('./access')
const fetch = require('./fetch')
const communications = require('./communications')
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
      isolate.createContext().then((context) => Promise.all([
        context.global.set('global', context.global.derefInto()),
        context.global.set('_ivm', ivm)
      ])
      .then(() => communications(isolate, context, internal, incoming, outgoing))
      .then(() => fetch(isolate, context, internal, incoming, outgoing))
      .then(() => isolate.compileScript('new ' + function() {
        delete _ivm
      }))
      .then((script) => script.run(context))
      .then(() => isolate.compileScript(app.code))
      .then((hostile) => hostile.run(context)))
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
      isolate.dispose()
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
  close: () =>  Promise.resolve(Object.keys(instances).forEach(module.exports.stop)),
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
  start: (appId) => {
    if (!instances[appId]) return
    instances[appId].start()
  },
  stop: (appId) => {
    if (!instances[appId]) return
    instances[appId].stop()
  },
  update: (app) => {
    if (!instances[app.appId]) return
    instances[appId].update(app)
  },
  run: (app) => {
    if (!instances[app.appId]) {
      const instance = create(app)
      instances[app.appId] = instance
      instance.start()
    } else { instances[app.appId].update(app) }
  },
  on: (appId, e, cb) => {
    if (!instances[appId]) return
    instances[appId].on(e, cb)
  },
  off: (appId, e, cb) => {
    if (!instances[appId]) return
    instances[appId].off(e, cb)
  },
  emit: (appId, e, ...args) => {
    if (!instances[appId]) return
    instances[appId].emit(e, ...args)
  }
}