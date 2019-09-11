// fetch
//   .get('http://localhost:8081/')
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err))

// hub.on('http', (socket) => {
//   // socket.emit('writeText', 'Hello')
//   // socket.emit('writeHtml', '<b>Hello</b>')
//   socket.emit('writeJson', { Hello: 'World' })
// })

// schedule(Date.now() + 5000, () => console.log('Time!'))

// // leveldb
// store.put(key, value)
// store.put(key)
// store.del(key)
// store.batch(array)
// const array = [
//   { type: 'del', key: 'father' },
//   { type: 'put', key: 'name', value: 'Yuri Irsenovich Kim' },
//   { type: 'put', key: 'dob', value: '16 February 1941' },
//   { type: 'put', key: 'spouse', value: 'Kim Young-sook' },
//   { type: 'put', key: 'occupation', value: 'Clown' }
// ]
// store.createReadStream(options)
// const options = {
//   gt, gte,
//   lt, lte,
//   reverse,
//   limit,
//   keys: true,
//   values: true
// }
// store.createKeyStream(options)
// store.createValueStream(options)

const socket = websocket('ws://localhost:8081')
socket.on('error', console.error)
socket.on('close', () => console.log('socket closed'))
socket.on('message', (message) => console.log(message))
socket.on('open', () => {
  console.log('socket open')
  // socket.
})

hub.on('websocket', (socket, req) => {
  socket
    .on('open', () => {
      console.log('OPEN')
    })
    .on('message', (message) => {
      console.log('Message from client', message)
      socket.emit('send', 'Hello Client!')
    })
    .on('error', (err) => {
      console.error(err)
    })
})
