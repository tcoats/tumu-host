const ivm = require('isolated-vm')
const httpserver = require('./httpserver')
const websocketserver = require('./websocketserver')
const websocketclient = require('./websocketclient')
const fetch = require('./fetch')
const store = require('./store')
const schedule = require('./schedule')

module.exports = (params) => {
  let publish = () => {}
  let emitter = () => { return { on: () => {}, emit: () => {} } }
  params.incoming.unhandled(params.internal.emit)
  params.internal.unhandled(publish)
  const childparams = {
    publish: (...args) => publish(...args),
    emitter: (...args) => emitter(...args)
  }
  Object.assign(childparams, params)
  return Promise.all([
    params.context.global.set('_bridge_emit', new ivm.Reference(params.outgoing.emit)),
    params.context.global.set('_bridge_on', new ivm.Reference((fn) => {
      publish = (...args) => fn.apply(
        undefined,
        args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
    })),
    params.context.global.set('_bridge_emitter', new ivm.Reference((fn) => {
      emitter = (e, ...args) => {
        const guestListeners = []
        const hostListeners = {}
        fn.apply(undefined, [
          new ivm.ExternalCopy(e).copyInto(),
          new ivm.Reference((subscriber) => {
            guestListeners.push((...args) => {
              subscriber.apply(
                undefined,
                args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
              // TODO: Fix TypeError: A non-transferable value was passed
              .catch(() => {})
            })
          }),
          new ivm.Reference((e, ...args) => {
            if (!hostListeners[e]) return
            hostListeners[e].forEach((fn) => fn(...args))
          }),
          ...args.map(arg => new ivm.ExternalCopy(arg).copyInto())
        ])
        // TODO: Fix TypeError: A non-transferable value was passed
        .catch(() => {})
        const result = {
          on: (e, fn) => {
            if (!hostListeners[e]) hostListeners[e] = []
            hostListeners[e].push(fn)
            return result
          },
          emit: (...args) => guestListeners.forEach((fn) => fn(...args))
        }
        return result
      }
    }))
  ])
  .then(() => params.isolate.compileScript('new ' + function() {
    const ivm = _ivm
    const emit = _bridge_emit; delete _bridge_emit
    const listeners = {}
    global.hub = {
      on: (e, fn) => {
        if (!listeners[e]) listeners[e] = []
        listeners[e].push(fn)
        return global.hub
      },
      emit: (...args) => emit.apply(undefined,
        args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
    }
    global.console = {
      log: (...args) => hub.emit('log', ...args),
      error: (...args) => hub.emit('error', ...args)
    }

    _bridge_on.apply(undefined, [
      new ivm.Reference((e, ...args) =>
        listeners[e].forEach((fn) => fn(...args)))])
    delete _bridge_on
    _bridge_emitter.apply(undefined, [
      new ivm.Reference((e, on, emit, ...args) => {
        if (!listeners[e]) return
        const emitListeners = {}
        on.apply(undefined, [
          new ivm.Reference((e, ...args) => {
            emitListeners[e].forEach((fn) => fn(...args))
          })])
        const result = {
          on: (e, fn) => {
            if (!emitListeners[e]) emitListeners[e] = []
            emitListeners[e].push(fn)
            return result
          },
          emit: (...args) => emit.apply(undefined,
            args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
        }
        listeners[e].forEach((fn) => fn(result, ...args))
      })
    ])
    delete _bridge_emitter
  }))
  .then((script) => script.run(params.context))
  .then(() => httpserver(childparams))
  .then(() => websocketserver(childparams))
  .then(() => websocketclient(childparams))
  .then(() => fetch(childparams))
  .then(() => store(childparams))
  .then(() => schedule(childparams))
}