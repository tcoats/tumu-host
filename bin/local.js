#!/usr/bin/env node

require('dotenv').config()
const fs = require('fs')
const Hub = require('odo-hub')
const http = require('http')
const WebSocket = require('ws')
fetch = require('axios')
const httpserver = require('../src/httpserver')
const websocketserver = require('../src/websocketserver')
const level = require('level-mem')
store = level()
websocket = (address) => new WebSocket(address)

const inputHelp = () => console.error(`
  An input file is not specified — please fix by:

  1. Passing a file path to this command
  2. Specifying a TUMU_INPUT environment variable
  3. Or setting TUMU_INPUT in an .env file
`)

if (process.argv.length > 3) return console.error(`
  Expecting a single input file path
`)

let input = null
if (process.argv.length == 3) input = process.argv[2]

if (!input) input = process.env.TUMU_FILE || 'index.js'
if (!input) return inputHelp()
if (!fs.existsSync(input))
  return console.error(`\n  Input file not found: ${input}\n`)
const code = fs.readFileSync(input, 'utf8')
if (!code) return console.error(`\n  Could not read input file: ${input}\n`)
schedule = (timestamp, fn) => {
  const now = Date.now()
  if (now > timestamp) fn()
  else setTimeout(fn, timestamp - now)
}
const incoming = Hub()
const internal = Hub()
const outgoing = Hub()
incoming.unhandled(internal.emit)
hub = {
  on: (e, fn) => {
    internal.on(e, fn)
    return hub
  },
  emit: outgoing.emit
}
const emitter = (e, ...args) => {
  const incoming = {}
  const outgoing = {}
  const socket = {
    on: (e, fn) => {
      if (!incoming[e]) incoming[e] = []
      incoming[e].push(fn)
      return socket
    },
    emit: (e, ...args) => {
      if (outgoing[e]) outgoing[e].forEach((fn) => fn(...args))
    }
  }
  setTimeout(() => internal.emit(e, socket, ...args), 0)
  const result = {
    on: (e, fn) => {
      if (!outgoing[e]) outgoing[e] = []
      outgoing[e].push(fn)
      return result
    },
    emit: (e, ...args) => {
      if (incoming[e]) incoming[e].forEach((fn) => fn(...args))
    }
  }
  return result
}
const childparams = { internal: incoming, emitter }
httpserver(childparams)
websocketserver(childparams)
const port = process.env.TUMU_PORT || 8080
const httpServer = http.createServer((req, res) => {
  incoming.emit('http', req, res)
})
const wsServer = new WebSocket.Server({ server: httpServer })
wsServer.on('connection', (ws, req) => {
  incoming.emit('websocket', ws, req)
})
eval(code)
new Promise((resolve) => httpServer.listen(port, resolve))
.then(() => {
  console.log(`Nau mai tumu-local · v${require(__dirname + '/../package.json').version} · web@${httpServer.address().address}:${httpServer.address().port}`)
  shutdown = () => Promise.all([
    wsServer.close(),
    httpServer.close()
  ])
  .then(() => console.log('E noho rā tumu-local'))
  process.once('SIGTERM', () => shutdown().then(() => process.exit(0)))
  process.once('SIGINT', () => shutdown().then(() => process.exit(0)))
  process.once('SIGUSR2', () => shutdown().then(() =>
    process.kill(process.pid, 'SIGUSR2')))
})
