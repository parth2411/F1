import express from 'express'
import { ChatService } from '../services/ChatService'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()
const chatService = new ChatService()

// Chat with F1 expert
router.post('/f1-expert', authMiddleware, async (req, res) => {
  try {
    const { message, context, history } = req.body
    const userId = req.user.userId

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      })
    }

    const response = await chatService.processF1Question(
      userId,
      message,
      context,
      history
    )

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process message' 
    })
  }
})

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const limit = parseInt(req.query.limit as string) || 10
    
    const history = await chatService.getChatHistory(userId, limit)
    
    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chat history' 
    })
  }
})

module.exports = router