export function validateEnv() {
  const { NETLIFY_DATABASE_URL, DATABASE_URL, JWT_SECRET, OPENROUTER_API_KEY } = process.env
  if (!NETLIFY_DATABASE_URL && !DATABASE_URL) {
    throw new Error('Missing NETLIFY_DATABASE_URL')
  }
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET')
  }
  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY')
  }
}
