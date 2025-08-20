export interface User {
  id: number
  email: string
  password_hash: string
  first_name: string
  last_name: string
  avatar_url?: string
  is_verified: boolean
  created_at: Date
  updated_at: Date
}