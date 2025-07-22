import { afterEach, test, expect } from 'node:test'
import { validateEnv } from '../src/lib/validateEnv.js'

// Preserve original value
const original = process.env.NETLIFY_DATABASE_URL

afterEach(() => {
  if (original === undefined) {
    delete process.env.NETLIFY_DATABASE_URL
  } else {
    process.env.NETLIFY_DATABASE_URL = original
  }
})

test('throws if NETLIFY_DATABASE_URL missing', () => {
  delete process.env.NETLIFY_DATABASE_URL
  expect(() => validateEnv()).toThrow('Missing NETLIFY_DATABASE_URL')
})
