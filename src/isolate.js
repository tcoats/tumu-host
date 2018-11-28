const ivm = require('isolated-vm')
const access = require('./access')
const instances = {}
const listeners = {}

const emit = (appId, ...args) => {
  if (!listeners[appId]) return
  for (let listener of listeners[appId]) listener(...args)
}

const run = (app) => {
  if (instances[app.appId]) {
    instances[app.appId].stop()
    delete instances[app.appId]
  }
  const isolate = new ivm.Isolate()
  const context = isolate.createContextSync()
  const jail = context.global
  jail.setSync('global', jail.derefInto())
  jail.setSync('_ivm', ivm)
  jail.setSync('_log', new ivm.Reference((...args) => emit(app.appId, ...args)))
  jail.setSync('_error', new ivm.Reference((...args) => emit(app.appId, ...args)))

  isolate.compileScriptSync('new ' + function() {
    const ivm = _ivm
    const log = _log
    const error = _error
    delete _ivm
    delete _log
    delete _error
    global.console = {
      log: (...args) => log.applyIgnored(
        undefined,
        args.map(arg => new ivm.ExternalCopy(arg).copyInto())),
      error: (...args) => error.applyIgnored(
        undefined,
        args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
    }
  }).runSync(context)

  const hostile = isolate.compileScriptSync(app.code)
  hostile.run(context).catch(err => {
    if (err.stack) return emit(app.appId, err.stack)
    emit(app.appId, err.toString())
  })

  instances[app.appId] = {
    stop: () => {

    }
  }
}

module.exports = {
  start: () => Object.values(access.apps).forEach(run),
  run,
  on: (appId, cb) => {
    if (!listeners[appId]) listeners[appId] = []
    listeners[appId].push(cb)
  },
  off: (appId, cb) => {
    const index = listeners[appId].indexOf(cb)
    if (index > -1) listeners[appId].splice(index, 1)
  }
}