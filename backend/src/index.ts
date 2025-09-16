import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { authMiddleware } from './middleware/auth'
import { errorMiddleware } from './middleware/error'
import { customersRouter } from './api/customers'
import { recordingsRouter } from './api/recordings'
import { adminRouter } from './api/admin'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes (temporarily disabled auth for testing)
app.use('/api/customers', customersRouter)
app.use('/api/recordings', recordingsRouter)
app.use('/api/admin', adminRouter)

// Error handling
app.use(errorMiddleware)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
