export interface UserLike {
  email?: string | null
  role?: string | null
}

export function isAdmin(user: UserLike): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  const email = user.email?.toLowerCase()
  return user.role === 'admin' || (!!adminEmail && email === adminEmail)
}
