const url = require('url')

module.exports = (params) => {
  params.internal.on('websocket', (ws, req) => {
    const payload = {}
    const properties = ['url', 'headers']
    properties.forEach((key) => payload[key] = req[key])
    payload.url = url.parse(payload.url, true)

    const socket = params.emitter('websocket', payload)

    const events = ['open', 'message', 'error']
    events.forEach((e) => ws.on(e, (...args) => {
      try { socket.emit(e, ...args) }
      catch (e) { socket.emit('error', e) }
    }))

    const methods = ['close', 'send', 'terminate']
    methods.forEach((name) => socket.on(name, (...args) => {
      try { ws[name](...args) }
      catch (e) { socket.emit('error', e) }
    }))

    socket.on('sendJson', (content) => {
      try { ws.send(JSON.stringify(content)) }
      catch (e) { socket.emit('error', e) }
    })
  })
}