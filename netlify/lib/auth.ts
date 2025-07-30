import { jwtVerify, createRemoteJWKSet } from 'jose'

const ISSUER = process.env.AUTH0_ISSUER as string
const AUDIENCE = process.env.AUTH0_AUDIENCE as string

const jwks = createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`))

export async function verifyAuth0Token(request: Request) {
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    throw new Error('Missing token')
  }
  const token = auth.slice(7)
  const { payload } = await jwtVerify(token, jwks, {
    issuer: ISSUER,
    audience: AUDIENCE
  })
  return payload
}
