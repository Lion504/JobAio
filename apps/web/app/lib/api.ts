export function getBackendEndpoint(): string {
  const endpoint = import.meta.env.WEB_APP_BACKEND_ENDPOINT
  if (!endpoint && typeof window !== 'undefined') {
    return window.location.origin
  }
  return endpoint || ''
}

export function getApiUrl(path: string): URL {
  const endpoint = getBackendEndpoint()
  if (!endpoint) {
    throw new Error('WEB_APP_BACKEND_ENDPOINT is not set')
  }
  return new URL(path, endpoint)
}
