import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { env } from '../config/env';

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
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

export const ACCESS_TOKEN_KEY = 'auth.accessToken';

export function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return env.apiToken;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? env.apiToken;
}

export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  config.headers.set('X-Requested-With', 'XMLHttpRequest');
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const statusCode = error.response?.status ?? 0;
    const body = error.response?.data;
    const message = Array.isArray(body?.message)
      ? body.message.join(' · ')
      : body?.message ?? error.message ?? `HTTP ${statusCode}`;

    return Promise.reject(new ApiError(statusCode, message, body));
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<T>(config);
  return response.data;
}
