import { Pool } from 'pg'
import axios from 'axios'

export class ChatService {
  private db: Pool
  private aiServiceUrl: string

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8002'
  }

  async processF1Question(
    userId: number,
    message: string,
    context: any = null,
    history: any[] = []
  ): Promise<string> {
    try {
      // Try to send request to AI service
      const response = await axios.post(`${this.aiServiceUrl}/chat/f1-expert`, {
        message,
        context,
        history: history.slice(-5) // Last 5 messages for context
      }, {
        timeout: 10000 // 10 second timeout
      })

      const aiResponse = response.data.response

      // Save chat history
      await this.saveChatHistory(userId, message, aiResponse, context)

      return aiResponse
    } catch (error) {
      console.error('Error processing F1 question:', error)
      
      // Fallback response if AI service is unavailable
      const fallbackResponse = this.getFallbackResponse(message)
      await this.saveChatHistory(userId, message, fallbackResponse, context)
      
      return fallbackResponse
    }
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('drs')) {
      return "DRS (Drag Reduction System) is a driver-adjustable bodywork feature that reduces aerodynamic drag to promote overtaking. It can only be used in designated DRS zones when a driver is within one second of the car ahead."
    }
    
    if (lowerMessage.includes('tire') || lowerMessage.includes('tyre')) {
      return "Formula 1 uses three types of dry weather tyres: Soft (red), Medium (yellow), and Hard (white). Each compound offers different levels of grip and durability. Drivers must use at least two different compounds during the race."
    }
    
    if (lowerMessage.includes('points')) {
      return "Points are awarded to the top 10 finishers: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1. An additional point is awarded for the fastest lap if the driver finishes in the top 10."
    }
    
    return "Thank you for your F1 question! The AI service is currently starting up. Please try again in a moment, or ask about DRS, tyres, or points system for quick information."
  }

  private async saveChatHistory(
    userId: number,
    message: string,
    response: string,
    context: any
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO chat_history (user_id, message, response, context_data)
        VALUES ($1, $2, $3, $4)
      `
      await this.db.query(query, [userId, message, response, context])
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  async getChatHistory(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT message, response, created_at
        FROM chat_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `
      const result = await this.db.query(query, [userId, limit])
      return result.rows.reverse() // Return in chronological order
    } catch (error) {
      console.error('Error fetching chat history:', error)
      return []
    }
  }
}