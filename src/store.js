const ivm = require('isolated-vm')
const level = require('level')

const databases = {}

module.exports = (params) => {
  if (!databases[params.app.appId]) {
    const path = `${process.cwd()}/.data/${params.app.appId}`
    databases[params.app.appId] = level(path)
  }
  const db = databases[params.app.appId]
  return Promise.all([
    params.context.global.set('_store_put', new ivm.Reference((key, value, resolve, reject) => {
      db.put(key, value)
        .then(() => resolve.apply(undefined, []))
        .catch((err) =>
          reject.apply(undefined, [new ivm.ExternalCopy(err).copyInto()]))
    })),
    params.context.global.set('_store_get', new ivm.Reference((key, resolve, reject) => {
      db.get(key)
        .then((value) =>
          resolve.apply(undefined, [new ivm.ExternalCopy(value).copyInto()]))
        .catch((err) =>
          reject.apply(undefined, [new ivm.ExternalCopy(err).copyInto()]))
    })),
    params.context.global.set('_store_del', new ivm.Reference((key, resolve, reject) => {
      db.del(key)
        .then(() =>
          resolve.apply(undefined, []))
        .catch((err) =>
          reject.apply(undefined, [new ivm.ExternalCopy(err).copyInto()]))
    })),
    params.context.global.set('_store_batch', new ivm.Reference((array, resolve, reject) => {
      db.batch(array)
        .then(() =>
          resolve.apply(undefined, []))
        .catch((err) =>
          reject.apply(undefined, [new ivm.ExternalCopy(err).copyInto()]))
    })),
    params.context.global.set('_store_stream', new ivm.Reference((options, ondata, onerror, onclose, onend, destroy) => {
      const stream = db.createReadStream(options)
        .on('data', (data) =>
          ondata
            .apply(undefined, [new ivm.ExternalCopy(data).copyInto()])
            .catch(() => {}))
        .on('error', (err) =>
          onerror.apply(undefined, [new ivm.ExternalCopy(err).copyInto()]))
        .on('close', () => onclose.apply(undefined, []))
        .on('end', () => onend.apply(undefined, []))
      destroy(new ivm.Reference(() => stream.destroy()))
    }))
  ])
  .then(() => params.isolate.compileScript('new ' + function() {
    const ivm = _ivm
    const put = _store_put; delete _store_put
    const get = _store_get; delete _store_get
    const del = _store_del; delete _store_del
    const batch = _store_batch; delete _store_batch
    const stream = _store_stream; delete _store_stream
    const createReadStream = (options) => {
      const listeners = {}
      const result = {
        on: (e, fn) => {
          if (!listeners[e]) listeners[e] = []
          listeners[e].push(fn)
          return result
        },
        emit: (e, ...args) => {
          if (listeners[e]) listeners[e].forEach((fn) => fn(...args))
        }
      }
      stream.apply(undefined, [
        new ivm.ExternalCopy(options).copyInto(),
        new ivm.Reference((data) => result.emit('data', data)),
        new ivm.Reference((err) => result.emit('error', err)),
        new ivm.Reference(() => result.emit('close')),
        new ivm.Reference(() => result.emit('end')),
        new ivm.Reference((destroy) => result.destroy = () =>
          destroy.apply(undefined, []))
      ])
      return result
    }
    global.store = {
      put: (key, value) => new Promise((resolve, reject) =>
        put.apply(undefined, [
           new ivm.ExternalCopy(key).copyInto(),
           new ivm.ExternalCopy(value).copyInto(),
           new ivm.Reference(resolve),
           new ivm.Reference(reject)
        ])),
      get: (key) => new Promise((resolve, reject) =>
        get.apply(undefined, [
           new ivm.ExternalCopy(key).copyInto(),
           new ivm.Reference(resolve),
           new ivm.Reference(reject)
        ])),
      del: (key) => new Promise((resolve, reject) =>
        del.apply(undefined, [
           new ivm.ExternalCopy(key).copyInto(),
           new ivm.Reference(resolve),
           new ivm.Reference(reject)
        ])),
      batch: (array) => new Promise((resolve, reject) =>
        batch.apply(undefined, [
           new ivm.ExternalCopy(array).copyInto(),
           new ivm.Reference(resolve),
           new ivm.Reference(reject)
        ])),
      createReadStream: createReadStream,
      createKeyStream: (options) => {
        const params = {}
        if (options) Object.assign(params, options)
        params.keys = true
        params.values = false
        return createReadStream(params)
      },
      createValueStream: (options) => {
        const params = {}
        if (options) Object.assign(params, options)
        params.keys = false
        params.values = true
        return createReadStream(params)
      }
    }
  }))
  .then((script) => script.run(params.context))
}