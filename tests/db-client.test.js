import { readFileSync } from 'fs'
import { transpileModule } from 'typescript'
const ts = readFileSync(new URL('../netlify/functions/db-client.ts', import.meta.url), 'utf8')
const js = transpileModule(ts, { compilerOptions: { module: 'ES2020', target: 'ES2020' } }).outputText
// eslint-disable-next-line no-eval
const { getClient } = await import(`data:text/javascript,${encodeURIComponent(js)}`)

test('getClient returns same instance', () => {
  const a = getClient()
  const b = getClient()
  expect(a).toBe(b)
})
