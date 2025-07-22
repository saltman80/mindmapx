export function validateEnv() {
  const { NETLIFY_DATABASE_URL, DATABASE_URL, JWT_SECRET } = process.env
  if (!NETLIFY_DATABASE_URL && !DATABASE_URL) {
    throw new Error('Missing NETLIFY_DATABASE_URL')
  }
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET')
  }
}
