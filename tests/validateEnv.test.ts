import { afterEach, test, expect } from 'node:test'
import { validateEnv } from '../src/lib/validateEnv.js'

// Preserve original values
const originalDB = process.env.NETLIFY_DATABASE_URL
const originalJWT = process.env.JWT_SECRET
const originalRouter = process.env.OPENROUTER_API_KEY

afterEach(() => {
  if (originalDB === undefined) {
    delete process.env.NETLIFY_DATABASE_URL
  } else {
    process.env.NETLIFY_DATABASE_URL = originalDB
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

const required = ['NETLIFY_DATABASE_URL', 'JWT_SECRET', 'OPENROUTER_API_KEY']

test('throws if no database URL provided', () => {
  delete process.env.NETLIFY_DATABASE_URL
  process.env.JWT_SECRET = 'secret'
  process.env.OPENROUTER_API_KEY = 'key'
  expect(() => validateEnv(required)).toThrow('Missing required environment variables: NETLIFY_DATABASE_URL')
})

test('throws if JWT_SECRET missing', () => {
  process.env.NETLIFY_DATABASE_URL = 'postgres://host/db'
  delete process.env.JWT_SECRET
  process.env.OPENROUTER_API_KEY = 'key'
  expect(() => validateEnv(required)).toThrow('Missing required environment variables: JWT_SECRET')
})

test('throws if OPENROUTER_API_KEY missing', () => {
  process.env.NETLIFY_DATABASE_URL = 'postgres://host/db'
  process.env.JWT_SECRET = 'secret'
  delete process.env.OPENROUTER_API_KEY
  expect(() => validateEnv(required)).toThrow('Missing required environment variables: OPENROUTER_API_KEY')
})

test('accepts NETLIFY_DATABASE_URL', () => {
  process.env.NETLIFY_DATABASE_URL = 'postgres://host/db'
  process.env.JWT_SECRET = 'secret'
  process.env.OPENROUTER_API_KEY = 'key'
  expect(() => validateEnv(required)).not.toThrow()
})

