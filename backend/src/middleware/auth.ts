import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

interface JwtPayload {
  userId: number
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization token required' 
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Additional validation for malformed tokens
    if (!token || token.length < 10) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token format' 
      })
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured')
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
    req.user = decoded
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    let errorMessage = 'Invalid or expired token'
    
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.message.includes('malformed')) {
        errorMessage = 'Token is malformed'
      } else if (error.message.includes('expired')) {
        errorMessage = 'Token has expired'
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Token is invalid'
      }
    }
    
    res.status(401).json({ 
      success: false, 
      error: errorMessage 
    })
  }
}

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Skip if token is obviously malformed
      if (token && token.length >= 10 && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
          req.user = decoded
        } catch (error) {
          // Silently fail for optional auth
          console.warn('Optional auth failed:', error instanceof jwt.JsonWebTokenError ? error.message : 'Unknown error')
        }
      }
    }
    
    next()
  } catch (error) {
    // Continue without auth if token is invalid
    console.warn('Optional auth error:', error)
    next()
  }
}

// Middleware to check if user is authenticated (for protected routes)
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }
  next()
}

// Middleware to validate JWT token format before processing
export const validateTokenFormat = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    // Basic JWT format validation (should have 3 parts separated by dots)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format - JWT should have 3 parts'
      })
    }
    
    // Check if each part is base64-like
    for (const part of tokenParts) {
      if (!part || part.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format - empty token part'
        })
      }
    }
  }
  
  next()
}