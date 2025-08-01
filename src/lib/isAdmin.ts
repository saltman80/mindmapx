import type { User } from './UserContext'

export function isAdmin(user?: User | null): boolean {
  return user?.role === 'admin'
}
