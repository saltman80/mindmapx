import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import mailchimp from '@mailchimp/mailchimp_marketing'
const {
  MAILCHIMP_API_KEY,
  MAILCHIMP_SERVER_PREFIX,
  MAILCHIMP_LIST_ID,
  ALLOWED_ORIGINS = '',
  RATE_LIMIT_MAX = '5',
  RATE_LIMIT_WINDOW_MS = '60000'
} = process.env

if (!MAILCHIMP_API_KEY) throw new Error('Missing MAILCHIMP_API_KEY')
if (!MAILCHIMP_SERVER_PREFIX) throw new Error('Missing MAILCHIMP_SERVER_PREFIX')
if (!MAILCHIMP_LIST_ID) throw new Error('Missing MAILCHIMP_LIST_ID')

const allowedOrigins = ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
const MAX_REQUESTS = parseInt(RATE_LIMIT_MAX, 10)
const WINDOW_MS = parseInt(RATE_LIMIT_WINDOW_MS, 10)

mailchimp.setConfig({
  apiKey: MAILCHIMP_API_KEY,
  server: MAILCHIMP_SERVER_PREFIX
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>()

export const handler: Handler = async (event) => {
  const origin = event.headers.origin || ''
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  }
  if (allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    }
  }

  if (!allowedOrigins.includes(origin)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Origin not allowed' })
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: 'POST,OPTIONS' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  const ip = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || '')
    .split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const rateInfo = rateLimitMap.get(ip) || { count: 0, firstRequest: now }
  if (now - rateInfo.firstRequest < WINDOW_MS) {
    rateInfo.count += 1
  } else {
    rateInfo.count = 1
    rateInfo.firstRequest = now
  }
  rateLimitMap.set(ip, rateInfo)
  if (rateInfo.count > MAX_REQUESTS) {
    return {
      statusCode: 429,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Too many requests' })
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing request body' })
    }
  }

  let data: any
  try {
    data = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON' })
    }
  }

  const { email, firstName, lastName } = data
  if (typeof email !== 'string' || !emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid email format' })
    }
  }

  try {
    await mailchimp.lists.addListMember(MAILCHIMP_LIST_ID, {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName || '',
        LNAME: lastName || ''
      }
    })
    console.info(`Newsletter subscription successful: ${email}`)
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    }
  } catch (error: any) {
    console.error('Mailchimp error:', error)
    const status = error?.status || 500
    return {
      statusCode: status,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Subscription failed' })
    }
  }
}