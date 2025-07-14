export function formatResponse<T>(
  success: boolean,
  data?: T,
  error?: string | Error
): ApiResponse<T> {
  if (success) {
    return {
      success: true,
      data: data !== undefined ? data : null,
      error: null
    }
  } else {
    let errorMessage: string
    if (error instanceof Error) {
      errorMessage = error.message || 'An unexpected error occurred'
    } else if (typeof error === 'string' && error.trim()) {
      errorMessage = error
    } else {
      errorMessage = 'An unexpected error occurred'
    }
    return {
      success: false,
      data: null,
      error: errorMessage
    }
  }
}