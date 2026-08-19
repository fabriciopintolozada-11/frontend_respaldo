import { env } from '../config/env'
import { ApiError, type ApiErrorBody } from './api-error'

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    'x-user-role': 'RECEPTIONIST',
    ...options.headers,
  }

  if (env.receptionistId) {
    headers['x-user-id'] = env.receptionistId
  }

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0)
  }

  const body = await readBody(response)
  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody | undefined)
  }

  return body as T
}

async function readBody(response: Response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return undefined

  try {
    return await response.json()
  } catch {
    return undefined
  }
}
