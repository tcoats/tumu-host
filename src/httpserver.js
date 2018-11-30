const url = require('url')
const bodyParser = require('body-parser')
const compression = require('compression')
const urlencodedParser = bodyParser.urlencoded({ limit: '50mb', extended: true })
const jsonParser = bodyParser.json({ limit: '50mb' })

const middleware = (next) => (req, res) =>
  compression()(req, res, () =>
    urlencodedParser(req, res, () =>
      jsonParser(req, res, () => next(req, res))))

const properties = ['url', 'headers', 'httpVersion', 'method', 'body']
const events = ['finish', 'error']
const methods = ['setHeader', 'writeHead', 'end']

module.exports = (params) => {
  params.internal.on('http', middleware((req, res) => {
    const payload = {}
    properties.forEach((key) => payload[key] = req[key])
    payload.url = url.parse(payload.url, true)

    const socket = params.emitter('http', payload)

    events.forEach((e) => res.on(e, (...args) => {
      try { socket.emit(e, ...args) }
      catch (e) { socket.emit('error', e) }
    }))

    methods.forEach((name) => socket.on(name, (...args) => {
      try { res[name](...args) }
      catch (e) { socket.emit('error', e) }
    }))

    socket.on('writeJson', (content) => {
      try {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(content, null, 2))
      }
      catch (e) { socket.emit('error', e) }
    })

    socket.on('writeText', (content) => {
      try {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end(content)
      }
      catch (e) { socket.emit('error', e) }
    })

    socket.on('writeHtml', (content) => {
      try {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(content)
      }
      catch (e) { socket.emit('error', e) }
    })
  }))
}