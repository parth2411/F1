import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthService } from '../services/AuthService'
import { authMiddleware } from '../middleware/auth'
import { validateRegistration, validateLogin } from '../middleware/validation'

const router = express.Router()
const authService = new AuthService()

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body

    // Check if user already exists
    const existingUser = await authService.findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await authService.createUser({
      email,
      password_hash: hashedPassword,
      first_name,
      last_name
    })

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_verified: user.is_verified
        },
        token
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed' 
    })
  }
})

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await authService.findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      })
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_verified: user.is_verified
        },
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    })
  }
})

// Verify token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await authService.findUserById(req.user.userId)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_verified: user.is_verified
        }
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Token verification failed' 
    })
  }
})

// Logout (optional - mainly handled on frontend)
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

module.exports = router