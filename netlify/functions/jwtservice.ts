import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET as string

export function sign(payload: string | object | Buffer, options?: jwt.SignOptions) {
  return jwt.sign(payload, secret, options)
}

export function verify(token: string) {
  return jwt.verify(token, secret)
}
