// backend/src/services/ChatService.ts
import { Pool } from 'pg'
import axios from 'axios'

export class ChatService {
  private db: Pool
  private aiServiceUrl: string

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001'
  }

  async processF1Question(
    userId: number,
    message: string,
    context: any = null,
    history: any[] = []
  ): Promise<string> {
    try {
      // Send request to AI service
      const response = await axios.post(`${this.aiServiceUrl}/chat/f1-expert`, {
        message,
        context,
        history: history.slice(-5) // Last 5 messages for context
      })

      const aiResponse = response.data.response

      // Save chat history
      await this.saveChatHistory(userId, message, aiResponse, context)

      return aiResponse
    } catch (error) {
      console.error('Error processing F1 question:', error)
      return "I'm sorry, I'm having trouble processing your question right now. Please try again."
    }
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