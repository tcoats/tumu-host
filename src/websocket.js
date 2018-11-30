const ivm = require('isolated-vm')
const url = require('url')
const WebSocket = require('ws')

const properties = ['url', 'headers']
const events = ['open', 'message', 'error']
const methods = ['close', 'send', 'terminate']

module.exports = (params) => {
  params.internal.on('websocket', (ws, req) => {
    const payload = {}
    properties.forEach((key) => payload[key] = req[key])
    payload.url = url.parse(payload.url, true)

    const socket = params.emitter('websocket', payload)

    events.forEach((e) => ws.on(e, (...args) => {
      try { socket.emit(e, ...args) }
      catch (e) { socket.emit('error', e) }
    }))

    methods.forEach((name) => socket.on(name, (...args) => {
      try { ws[name](...args) }
      catch (e) { socket.emit('error', e) }
    }))

    socket.on('sendJson', (content) => {
      try { ws.send(JSON.stringify(content)) }
      catch (e) { socket.emit('error', e) }
    })
  })
  return params.context.global.set('_websocket', new ivm.Reference((address, onmessage, onerror, onclose, onopen, close, send) => {
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
}