export function getAuthToken(): string {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') || '' : ''
}
