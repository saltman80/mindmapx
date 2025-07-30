import { jwtVerify, createRemoteJWKSet } from 'jose'

const ISSUER = process.env.AUTH0_ISSUER as string
const AUDIENCE = process.env.AUTH0_AUDIENCE as string

if (!ISSUER || !AUDIENCE) {
  throw new Error('Missing Auth0 issuer or audience')
}

const jwks = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`))

export async function verifyAuth0Token(request: Request) {
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    const error = new Error('Missing token')
    ;(error as any).statusCode = 401
    throw error
  }
  const token = auth.slice(7)
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: AUDIENCE
    })
    return payload
  } catch (err: any) {
    err.statusCode = 401
    throw err
  }
}
