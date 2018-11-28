require('dotenv').config()
const http = require('http')
const WebSocket = require('ws')
const access = require('./access')
const protocol = require('./protocol')
const isolate = require('./isolate')

const apiPort = process.env.TUMU_API_PORT || 8081
const apiHttpServer = http.createServer()
const apiWsServer = new WebSocket.Server({ server: apiHttpServer })
apiWsServer.on('connection', (socket, req) => {
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

const port = process.env.TUMU_PORT || 8080
const httpServer = http.createServer()
const wsServer = new WebSocket.Server({ server: httpServer })
wsServer.on('connection', (socket, req) => {

})

Promise.all([
  access.open(),
  isolate.open(),
  new Promise((resolve) => apiHttpServer.listen(apiPort, resolve)),
  new Promise((resolve) => httpServer.listen(port, resolve))
])
.then(() => {
  console.log(`Nau mai tumu · v${require(__dirname + '/../package.json').version} · api@${apiHttpServer.address().address}:${apiHttpServer.address().port} · web@${httpServer.address().address}:${httpServer.address().port}`)
  shutdown = () => Promise.all([
    apiWsServer.close(),
    apiHttpServer.close(),
    wsServer.close(),
    httpServer.close()
  ])
  .then(() => console.log('E noho rā tumu'))
  process.once('SIGTERM', () => shutdown().then(() => process.exit(0)))
  process.once('SIGINT', () => shutdown().then(() => process.exit(0)))
  process.once('SIGUSR2', () => shutdown().then(() =>
    process.kill(process.pid, 'SIGUSR2')))
})
