const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly body?: ApiErrorBody;

  constructor(statusCode: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as ApiErrorBody | undefined;
    const message = Array.isArray(body?.message)
      ? body!.message.join(' · ')
      : (body?.message ?? `HTTP ${response.status}`);
    throw new ApiError(response.status, message, body);
  }

  return (await response.json()) as T;
}

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PATCH';
  data?: unknown;
}

async function request<T>(config: RequestConfig): Promise<{ data: T }> {
  const response = await fetch(buildUrl(config.url), {
    method: config.method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: config.data === undefined ? undefined : JSON.stringify(config.data),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as ApiErrorBody | undefined;
    const message = Array.isArray(body?.message)
      ? body!.message.join(' · ')
      : (body?.message ?? `HTTP ${response.status}`);
    throw new ApiError(response.status, message, body);
  }

  return { data: (await response.json()) as T };
}

export const httpClient = { get, request };