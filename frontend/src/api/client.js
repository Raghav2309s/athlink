const API_BASE = 'http://localhost:4000/api/v1'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result?.error?.message || 'Something went wrong',
    )
  }

  return result.data
}