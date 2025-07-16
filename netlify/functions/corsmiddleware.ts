import type { Handler } from '@netlify/functions'

export function cors(handler: Handler): Handler {
  return async (event, context) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    }
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders, body: '' }
    }
    const response = await handler(event, context)
    return {
      ...response,
      headers: { ...(response.headers || {}), ...corsHeaders }
    }
  }
}
