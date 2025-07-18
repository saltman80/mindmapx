import { useState } from 'react'

export interface User {
  name: string
  avatarUrl?: string
  role?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const logout = () => setUser(null)
  return { user, logout }
}
