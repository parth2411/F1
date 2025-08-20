import { Pool } from 'pg'
import { User } from '../types/User'

export class AuthService {
  private db: Pool

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1'
      const result = await this.db.query(query, [email])
      return result.rows[0] || null
    } catch (error) {
      console.error('Error finding user by email:', error)
      throw error
    }
  }

  async findUserById(id: number): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1'
      const result = await this.db.query(query, [id])
      return result.rows[0] || null
    } catch (error) {
      console.error('Error finding user by ID:', error)
      throw error
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const query = `
        INSERT INTO users (email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, first_name, last_name, is_verified, created_at
      `
      const values = [
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name
      ]
      
      const result = await this.db.query(query, values)
      return result.rows[0]
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    try {
      const setClause = Object.keys(userData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      
      const query = `
        UPDATE users 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, first_name, last_name, is_verified, created_at, updated_at
      `
      
      const values = [id, ...Object.values(userData)]
      const result = await this.db.query(query, values)
      return result.rows[0] || null
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }
}