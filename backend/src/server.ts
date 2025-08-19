// backend/src/server.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/f1', require('./routes/f1'))
app.use('/api/chat', require('./routes/chat'))

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId)
    console.log(`Client ${socket.id} joined session ${sessionId}`)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})