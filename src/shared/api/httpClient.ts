import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { cleanServerMessage } from '../lib/utils';

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
  const token = currentToken || localStorage.getItem('token') || env.apiToken;
  
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('No auth token found in localStorage or env.apiToken - request will be unauthenticated');
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
    const rawMessage = Array.isArray(body?.message)
      ? body.message.join(' · ')
      : body?.message ?? error.message ?? `HTTP ${statusCode}`;
    // The end user never sees internal requirement codes (RN-xx / HU-xx / US-xx
    // / FE-xx); they are stripped from the surfaced message.
    const message = cleanServerMessage(rawMessage) || `HTTP ${statusCode}`;

    return Promise.reject(new ApiError(statusCode, message, body));
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<T>(config);
  return response.data;
}
