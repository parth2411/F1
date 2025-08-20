import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'F1 Dashboard Backend',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8001
  })
})

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'F1 Dashboard API is running!', timestamp: new Date() })
})

// Import and use route modules
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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 8001

server.listen(PORT, () => {
  console.log(`🚀 F1 Dashboard Backend running on port ${PORT}`)
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1]}`)
})

export { app, io }