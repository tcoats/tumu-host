require('dotenv').config()
const http = require('http')
const WebSocket = require('ws')
const access = require('./access')
const protocol = require('./protocol')
const isolate = require('./isolate')

const httpServer = http.createServer()

const wsServer = new WebSocket.Server({ server: httpServer })
wsServer.on('connection', (socket, req) => {
  const api = {
    send: (command, params) => socket.send(JSON.stringify([command, params])),
    close: () => socket.terminate(),
    isclosed: false
  }
  if (req.headers.token) api.token = req.headers.token
  socket.on('message', (data) => {
    let payload = null
    try { payload = JSON.parse(data) }
    catch (e) { return socket.terminate() }
    if (!Array.isArray(payload) || payload.length != 2 || !protocol[payload[0]])
      return socket.terminate()
    protocol[payload[0]](api, payload[1])
  })
  socket.on('close', () => api.isclosed = true)
})

access.load().then(() => {
  isolate.load()
  httpServer.listen(8080, () => {
    const version = require(__dirname + '/../package.json').version
    const host = httpServer.address().address
    const boundport = httpServer.address().port
    console.log(`tumu ${version} listening on ${host}:${boundport}`)
    shutdown = () => {
      console.log('Ōhākī shutting down')
      // hub.emit('shutdown', null).then(() => {
        wsServer.close()
        httpServer.close()
        console.log('E noho rā')
        process.exit(0)
      // })
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  })
})
