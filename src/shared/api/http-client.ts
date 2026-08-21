import axios from 'axios';

import { env } from '../config/env';

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

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: {
    Accept: 'application/json',
    ...(env.apiToken ? { Authorization: `Bearer ${env.apiToken}` } : {}),
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError<ApiErrorBody>(error)) return Promise.reject(error);

    const statusCode = error.response?.status ?? 0;
    const body = error.response?.data;
    const message = Array.isArray(body?.message)
      ? body.message.join(' · ')
      : (body?.message ?? error.message ?? `HTTP ${statusCode}`);

    return Promise.reject(new ApiError(statusCode, message, body));
  },
);
