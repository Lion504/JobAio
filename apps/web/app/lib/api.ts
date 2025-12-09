type RequestLike = Pick<Request, 'url'>

function getRequestOrigin(request?: RequestLike | string) {
  if (!request) return ''
  try {
    const url =
      typeof request === 'string' ? new URL(request) : new URL(request.url)
    return url.origin
  } catch {
    return ''
  }
}

export function getBackendEndpoint(request?: RequestLike | string): string {
  const envEndpoint = import.meta.env.WEB_APP_BACKEND_ENDPOINT
  if (envEndpoint) return envEndpoint

  const requestOrigin = getRequestOrigin(request)
  if (requestOrigin) return requestOrigin

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return ''
}

export function getApiUrl(path: string, request?: RequestLike | string): URL {
  const endpoint = getBackendEndpoint(request)
  if (!endpoint) {
    throw new Error('WEB_APP_BACKEND_ENDPOINT is not set')
  }
  return new URL(path, endpoint)
}
