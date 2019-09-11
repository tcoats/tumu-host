require('dotenv').config()
const fs = require('fs')
try { fs.mkdirSync(`${process.cwd()}/.tumu-data`) } catch (e) {}
const http = require('http')
const WebSocket = require('ws')
const access = require('./access')
const protocol = require('./protocol')
const isolate = require('./isolate')

const apiPort = process.env.TUMU_API_PORT || 8081
const apiHttpServer = http.createServer((req, res) => {
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end(`npm i -g tumu\ntumu login --host=${req.headers.host}`)
})
const apiWsServer = new WebSocket.Server({ noServer: true })
apiHttpServer.on('upgrade', (req, socket, head) => {
  apiWsServer.handleUpgrade(req, socket, head, (socket) => {
    const api = {
      send: (command, params) => socket.send(JSON.stringify([command, params])),
      close: () => socket.terminate(),
      isclosed: false
    }
    if (req.headers.token) api.token = req.headers.token
    if (req.headers['sec-websocket-protocol'])
      api.token = req.headers['sec-websocket-protocol']
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
})

const findApp = (req) => {
  let app = null
  // match based on explicit header
  if (req.headers.TUMU_APP && access.apps[req.headers.TUMU_APP])
    app = access.apps[req.headers.TUMU_APP]
  if (!app && req.headers.host) {
    // match based on domain
    const domain = req.headers.host.split(/[:]+/)[0]
    if (access.domains[domain]) {
      const appId = access.domains[domain]
      if (access.apps[appId]) app = access.apps[appId]
    }
    // test subdomain
    if (!app) {
      const test = req.headers.host.split(/[:./]+/)[0]
      if (access.apps[test]) app = access.apps[test]
    }
  }
  // // match based on first directory of path
  // if (!app) {
  //   const chunks = req.url.split(/[/]+/)
  //   if (chunks.length > 1 && access.apps[chunks[1]])
  //     app = access.apps[chunks[1]]
  // }
  return app
}

const port = process.env.TUMU_PORT || 8080
const httpServer = http.createServer((req, res) => {
  const app = findApp(req)
  if (!app) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    return res.end('App not found')
  }
  if (app.disabled) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    return res.end('App disabled')
  }
  isolate.emit(app.appId, 'http', req, res)
})
const wsServer = new WebSocket.Server({ server: httpServer })
wsServer.on('connection', (ws, req) => {
  const app = findApp(req)
  if (!app) return ws.close()
  isolate.emit(app.appId, 'websocket', ws, req)
})

access.open().then(() => isolate.open())
.then(() => Promise.all([
  new Promise((resolve) => apiHttpServer.listen(apiPort, resolve)),
  new Promise((resolve) => httpServer.listen(port, resolve))
]))
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
