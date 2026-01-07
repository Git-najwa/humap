import { io } from 'socket.io-client'

const URL = process.env.URL || 'http://localhost:3000'

const socket = io(URL)

socket.on('connect', () => {
  console.log('🔌 Test client connected:', socket.id)
  socket.emit('join:user', 'test-user')
  setTimeout(() => {
    socket.disconnect()
    console.log('🔌 Test client disconnected')
    process.exit(0)
  }, 1500)
})

socket.on('connect_error', (err) => {
  console.error('🔌 Test client connect_error:', err.message || err)
  process.exit(1)
})

socket.on('disconnect', (reason) => {
  console.log('🔌 Test client received disconnect:', reason)
})
