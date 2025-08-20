export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar_url: string | null
  is_verified: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface AuthResponse {
  user: User
  token: string
}