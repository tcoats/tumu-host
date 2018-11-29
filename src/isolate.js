const ivm = require('isolated-vm')
const hub = require('odo-hub')
const axios = require('axios')
const http = require('./http')
const websocket = require('./websocket')
const access = require('./access')
const instances = {}

const axiosResponseProperties = ['data', 'headers', 'statusText', 'status']

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
      let publish = () => {}
      let emitter = () => {
        return {
          on: () => {},
          emit: () => {}
        }
      }
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
      isolate.createContext().then((context) => Promise.all([
        context.global.set('global', context.global.derefInto()),
        context.global.set('_ivm', ivm),
        context.global.set('_fetch', new ivm.Reference((params, resolve, reject) => {
          axios(params).then((res) => {
            const payload = {}
            axiosResponseProperties.forEach((key) => payload[key] = res[key])
            resolve.apply(undefined, [new ivm.ExternalCopy(payload).copyInto()])
          }).catch((err) =>
            reject.apply(undefined, [new ivm.ExternalCopy(err).copyInto()]))
        })),
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
        const ivm = _ivm; delete _ivm
        const emit = _emit; delete _emit
        const fetch = _fetch; delete _fetch
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
        global.fetch = (params) => new Promise((resolve, reject) =>
          fetch.apply(undefined, [
             new ivm.ExternalCopy(params).copyInto(),
             new ivm.Reference(resolve),
             new ivm.Reference(reject)
          ]))
        global.fetch.request = (...args) => global.fetch(...args)
        const urlOnlyMethods = ['get', 'delete', 'head', 'options']
        urlOnlyMethods.forEach((method) =>
          global.fetch[method] = (url, config) => {
            const params = { url: url, method: method }
            if (config) Object.assign(params, config)
            return global.fetch(params)
          })
        const urlAndDataMethods = ['post', 'put', 'patch']
        urlAndDataMethods.forEach((method) =>
          global.fetch[method] = (url, data, config) => {
            const params = { url: url, data: data, method: method }
            if (config) Object.assign(params, config)
            return global.fetch(params)
          })

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