import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

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

let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set('X-Requested-With', 'XMLHttpRequest');
  if (currentToken) {
    config.headers.set('Authorization', `Bearer ${currentToken}`);
  } else if (env.apiToken) {
    config.headers.set('Authorization', `Bearer ${env.apiToken}`);
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: boolean) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown): void {
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const statusCode = error.response?.status ?? 0;

    if (statusCode === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<boolean>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => httpClient.request(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { tryRefresh } = await import('../../features/auth/providers/AuthProvider');
        const refreshed = await tryRefresh();
        if (refreshed) {
          processQueue(null);
          return httpClient.request(originalRequest);
        }
        processQueue(error);
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

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
