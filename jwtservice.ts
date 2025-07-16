import jwt, { JwtPayload } from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET')
}

const rawExpiresIn = process.env.JWT_EXPIRES_IN ?? '1h'

function normalizeExpiresIn(value: string): string | number {
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10)
  }
  if (/^\d+(s|m|h|d|y)$/.test(value)) {
    return value
  }
  console.warn(`Invalid JWT_EXPIRES_IN "${value}", using default "1h"`)
  return '1h'
}

const EXPIRES_IN = normalizeExpiresIn(rawExpiresIn)

export interface ITokenPayload {
  userId: string
  // add other custom claims here
}

export function generateToken(payload: ITokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: EXPIRES_IN
  })
}

export function verifyToken(token: string): JwtPayload & ITokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof decoded === 'string') {
      throw new Error('Unexpected token payload type')
    }
    return decoded as JwtPayload & ITokenPayload
  } catch {
    throw new Error('Invalid or expired token')
  }
}