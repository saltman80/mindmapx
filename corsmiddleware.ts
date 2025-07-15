const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean)
if (allowedOrigins.length === 0) {
  console.error('CORS middleware: No allowed origins configured. Please set CORS_ORIGIN env var to a comma-separated list of allowed origins.')
}

export function cors(handler: Handler): Handler {
  return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    const requestOrigin = event.headers.origin || event.headers.Origin
    let allowedOrigin: string

    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes('*')) {
        allowedOrigin = requestOrigin || '*'
      } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        allowedOrigin = requestOrigin
      } else {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'CORS origin denied' })
        }
      }
    } else {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'CORS origin configuration missing' })
      }
    }

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      Vary: 'Origin'
    }

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders, body: '' }
    }

    try {
      const response = await handler(event, context)
      return {
        ...response,
        headers: {
          ...(response.headers || {}),
          ...corsHeaders
        }
      }
    } catch (err) {
      console.error('CORS middleware caught error from handler:', err)
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Internal Server Error' })
      }
    }
  }
}

// Alias withCors for compatibility with older code
export const withCors = cors
