const ivm = require('isolated-vm')
const http = require('./http')
const websocket = require('./websocket')

module.exports = (isolate, context, internal, incoming, outgoing) => {
  let publish = () => {}
  let emitter = () => { return { on: () => {}, emit: () => {} } }
  incoming.unhandled(internal.emit)
  internal.unhandled(publish)
  http(
    internal,
    (...args) => publish(...args),
    (...args) => emitter(...args))
  websocket(
    internal,
    (...args) => publish(...args),
    (...args) => emitter(...args))
  return Promise.all([
    context.global.set('_emit', new ivm.Reference(outgoing.emit)),
    context.global.set('_on', new ivm.Reference((fn) => {
      publish = (...args) => fn.apply(
        undefined,
        args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
    })),
    context.global.set('_emitter', new ivm.Reference((fn) => {
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
        return {
          on: (e, fn) => {
            if (!hostListeners[e]) hostListeners[e] = []
            hostListeners[e].push(fn)
          },
          emit: (...args) => guestListeners.forEach((fn) => fn(...args))
        }
      }
    }))
  ])
  .then(() => isolate.compileScript('new ' + function() {
    const ivm = _ivm
    const emit = _emit; delete _emit
    const listeners = {}
    global.hub = {
      on: (e, fn) => {
        if (!listeners[e]) listeners[e] = []
        listeners[e].push(fn)
      },
      emit: (...args) => emit.apply(undefined,
        args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
    }
    global.console = {
      log: (...args) => hub.emit('log', ...args),
      error: (...args) => hub.emit('error', ...args)
    }

    _on.apply(undefined, [
      new ivm.Reference((e, ...args) =>
        listeners[e].forEach((fn) => fn(...args)))])
    delete _on
    _emitter.apply(undefined, [
      new ivm.Reference((e, on, emit, ...args) => {
        if (!listeners[e]) return
        const emitListeners = {}
        on.apply(undefined, [
          new ivm.Reference((e, ...args) => {
            emitListeners[e].forEach((fn) => fn(...args))
          })])
        listeners[e].forEach((fn) => fn({
          on: (e, fn) => {
            if (!emitListeners[e]) emitListeners[e] = []
            emitListeners[e].push(fn)
          },
          emit: (...args) => emit.apply(undefined,
            args.map(arg => new ivm.ExternalCopy(arg).copyInto()))
        }, ...args))
      })
    ])
    delete _emitter
  }))
  .then((script) => script.run(context))
}