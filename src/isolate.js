const ivm = require('isolated-vm')
const hub = require('odo-hub')
const access = require('./access')
const instances = {}

const create = (app) => {
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
      isolate = new ivm.Isolate()
      internal = hub()
      incoming.unhandled(internal.emit)
      const context = isolate.createContextSync()
      const jail = context.global
      jail.setSync('global', jail.derefInto())
      jail.setSync('_ivm', ivm)
      jail.setSync('_on', new ivm.Reference((e, cb) =>
        internal.on(e, (...args) => cb.applyIgnored(
          undefined,
          args.map(arg => new ivm.ExternalCopy(arg).copyInto())))))
      jail.setSync('_emit', new ivm.Reference(outgoing.emit))

      isolate.compileScriptSync('new ' + function() {
        const ivm = _ivm
        const on = _on
        const emit = _emit
        delete _ivm
        delete _on
        delete _emit
        global.hub = {
          on: (e, cb) => on.applyIgnored(undefined, [
            new ivm.ExternalCopy(e).copyInto(), new ivm.Reference(cb)]),
          emit: (...args) => emit.applyIgnored(undefined,
            args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
        }
      }).runSync(context)

      const hostile = isolate.compileScriptSync(app.code)
      hostile.run(context).catch(err => {
        if (err.stack) return outgoing.emit('log', err.stack)
        outgoing.emit('log', err.toString())
      })
    },
    stop: () => {
      if (!isolate) return
      incoming.unhandledOff(internal.emit)
      internal = null
      isolate.dispose()
      isolate = null
    },
    update: (app) => {
      code = app.code
      result.stop()
      result.start()
    }
  }
  return result
}

module.exports = {
  load: () => Object.values(access.apps).forEach(module.exports.run),
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