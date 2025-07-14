let client
export function initNeonClient(connectionString) {
  if (!connectionString) throw new Error('Missing connection string for Neon client initialization')
  if (!client) client = createClient({ connectionString })
}
export async function query(sql, params = []) {
  if (!client) throw new Error('Neon client not initialized. Call initNeonClient first.')
  const { rows } = await client.query(sql, params)
  return rows
}