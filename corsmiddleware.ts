import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';

export function withCors(handler: Handler): Handler {
  return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: '',
      };
    }

    const response = await handler(event, context);

    if (response) {
        response.headers = {
            ...response.headers,
            'Access-Control-Allow-Origin': '*',
        };
    }

    return response;
  };
}
