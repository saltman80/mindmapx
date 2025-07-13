let client: ReturnType<typeof createClient> | null = null

export async function connect(connectionString: string): Promise<void> {
  if (client) return
  client = createClient({ connectionString })
  await client.connect()
}

export async function query(sql: string, params: any[] = []): Promise<QueryResult> {
  if (!client) {
    throw new Error('Database client is not connected. Call connect() before querying.')
  }
  return await client.query(sql, params)
}

export async function close(): Promise<void> {
  if (!client) return
  await client.end()
  client = null
}