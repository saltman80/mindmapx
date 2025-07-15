export function validateEnv() {
  const required = ['NETLIFY_DATABASE_URL']
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing ${key}`)
    }
  }
}
