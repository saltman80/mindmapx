import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface User {
  id?: string
  email?: string
  name?: string
  role?: string
  picture?: string
}

interface UserContextValue {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  fetchUser: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const fetchUser = async () => {
    try {
      const res = await fetch('/.netlify/functions/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        setUser(data?.user || null)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

