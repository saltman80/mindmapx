import { jwtVerify, createRemoteJWKSet } from 'jose'

const ISSUER_RAW = process.env.AUTH0_ISSUER as string
const AUDIENCE = process.env.AUTH0_AUDIENCE as string

// Normalize issuer so verification works whether or not the env variable
// includes a trailing slash.
const ISSUER = ISSUER_RAW.replace(/\/+$/, '') + '/'

if (!ISSUER || !AUDIENCE) {
  throw new Error('Missing Auth0 issuer or audience')
}

// Remove the trailing slash when constructing the JWKS URL
const jwksIssuer = ISSUER.replace(/\/+$/, '')
const jwks = createRemoteJWKSet(new URL(`${jwksIssuer}/.well-known/jwks.json`))

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
