import { afterEach, test, expect } from 'node:test'
import { validateEnv } from '../src/lib/validateEnv.js'

// Preserve original values
const originalDB = process.env.NETLIFY_DATABASE_URL
const originalLocal = process.env.DATABASE_URL
const originalJWT = process.env.JWT_SECRET
const originalRouter = process.env.OPENROUTER_API_KEY

afterEach(() => {
  if (originalDB === undefined) {
    delete process.env.NETLIFY_DATABASE_URL
  } else {
    process.env.NETLIFY_DATABASE_URL = originalDB
  }
  if (originalLocal === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalLocal
  }
  if (originalJWT === undefined) {
    delete process.env.JWT_SECRET
  } else {
    process.env.JWT_SECRET = originalJWT
  }
  if (originalRouter === undefined) {
    delete process.env.OPENROUTER_API_KEY
  } else {
    process.env.OPENROUTER_API_KEY = originalRouter
  }
})

test('throws if no database URL provided', () => {
  delete process.env.NETLIFY_DATABASE_URL
  delete process.env.DATABASE_URL
  process.env.JWT_SECRET = 'secret'
  process.env.OPENROUTER_API_KEY = 'key'
  expect(() => validateEnv()).toThrow('Missing NETLIFY_DATABASE_URL')
})

test('throws if JWT_SECRET missing', () => {
  process.env.NETLIFY_DATABASE_URL = 'postgres://host/db'
  delete process.env.DATABASE_URL
  delete process.env.JWT_SECRET
  process.env.OPENROUTER_API_KEY = 'key'
  expect(() => validateEnv()).toThrow('Missing JWT_SECRET')
})

test('throws if OPENROUTER_API_KEY missing', () => {
  process.env.NETLIFY_DATABASE_URL = 'postgres://host/db'
  delete process.env.DATABASE_URL
  process.env.JWT_SECRET = 'secret'
  delete process.env.OPENROUTER_API_KEY
  expect(() => validateEnv()).toThrow('Missing OPENROUTER_API_KEY')
})

test('accepts NETLIFY_DATABASE_URL', () => {
  process.env.NETLIFY_DATABASE_URL = 'postgres://host/db'
  delete process.env.DATABASE_URL
  process.env.JWT_SECRET = 'secret'
  process.env.OPENROUTER_API_KEY = 'key'
  expect(() => validateEnv()).not.toThrow()
})

test('accepts DATABASE_URL fallback', () => {
  delete process.env.NETLIFY_DATABASE_URL
  process.env.DATABASE_URL = 'postgres://host/db'
  process.env.JWT_SECRET = 'secret'
  process.env.OPENROUTER_API_KEY = 'key'
  expect(() => validateEnv()).not.toThrow()
})
