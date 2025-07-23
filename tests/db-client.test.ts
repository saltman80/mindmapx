const { getClient } = await import('../netlify/functions/db-client.ts')

test('getClient returns same instance', () => {
  const a = getClient()
  const b = getClient()
  expect(a).toBe(b)
})
