import jwt from 'jsonwebtoken'

export function signToken(payload: any) {
  return jwt.sign(payload, process.env.JWT_SECRET!)
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!)
}
