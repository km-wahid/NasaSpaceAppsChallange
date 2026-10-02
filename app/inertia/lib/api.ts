export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))
  const token = cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : ''
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    signal,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || response.redirected) {
    const reason =
      response.status === 401 || response.redirected
        ? 'Please sign in to use your farm.'
        : (data?.error ?? data?.errors?.[0]?.message ?? `Request failed (${response.status}).`)
    throw new Error(reason)
  }
  return data as T
}
