const url = require('url')

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
}