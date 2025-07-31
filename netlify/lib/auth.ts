import { jwtVerify, createRemoteJWKSet } from 'jose'

const ISSUER_RAW = process.env.AUTH0_ISSUER as string
const AUDIENCE = process.env.AUTH0_AUDIENCE as string
const CLIENT_ID = process.env.AUTH0_CLIENT_ID

// Normalize issuer so verification works whether or not the env variable
// includes a trailing slash.
const ISSUER = ISSUER_RAW.replace(/\/+$/, '') + '/'

if (!ISSUER || !AUDIENCE) {
  throw new Error('Missing Auth0 issuer or audience')
}

// Remove the trailing slash when constructing the JWKS URL
const jwksIssuer = ISSUER.replace(/\/+$/, '')
const jwks = createRemoteJWKSet(new URL(`${jwksIssuer}/.well-known/jwks.json`))

const VALID_AUDIENCES = [AUDIENCE]
if (CLIENT_ID) {
  VALID_AUDIENCES.push(CLIENT_ID)
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

export async function verifyAuth0Token(request: Request) {
  const token = extractBearerToken(request)
  if (!token) {
    const error = new Error('Missing token')
    ;(error as any).statusCode = 401
    throw error
  }
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: VALID_AUDIENCES
    })
    return payload
  } catch (err: any) {
    err.statusCode = 401
    throw err
  }
}
