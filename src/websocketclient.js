const ivm = require('isolated-vm')
const WebSocket = require('ws')

module.exports = (params) =>
  params.context.global.set('_websocket', new ivm.Reference((address, onmessage, onerror, onclose, onopen, close, send) => {
    try {
      let connection = null
      close
        .apply(undefined, [new ivm.Reference(() => connection.close())])
        .catch(() => {})
      send
        .apply(undefined, [
          new ivm.Reference((message) => connection.send(message))])
        .catch(() => {})
      connection = new WebSocket(address)
        .on('message', (message) =>
          onmessage
            .apply(undefined, [new ivm.ExternalCopy(message).copyInto()])
            .catch(() => {}))
        .on('error', (err) =>
          onerror.apply(undefined, [
            new ivm.ExternalCopy(err.toString()).copyInto()]))
        .on('close', () => onclose.apply(undefined, []))
        .on('open', () => onopen.apply(undefined, []))
    } catch (err) {
      onerror.apply(undefined, [
        new ivm.ExternalCopy(err.toString()).copyInto()])
    }
  }))
  .then(() => params.isolate.compileScript('new ' + function() {
    const ivm = _ivm
    const websocket = _websocket; delete _websocket
    global.websocket = (address) => {
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
      websocket.apply(undefined, [
        new ivm.ExternalCopy(address).copyInto(),
        new ivm.Reference((message) => result.emit('message', message)),
        new ivm.Reference((err) => result.emit('error', err)),
        new ivm.Reference(() => result.emit('close')),
        new ivm.Reference(() => result.emit('open')),
        new ivm.Reference((close) => result.close = () =>
          close.apply(undefined, [])),
        new ivm.Reference((send) => result.send = (message) =>
          send.apply(undefined, [new ivm.ExternalCopy(message).copyInto()]))
      ])
      return result
    }
  }))
  .then((script) => script.run(params.context))