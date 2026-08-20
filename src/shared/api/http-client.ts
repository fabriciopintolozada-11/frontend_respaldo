import axios from 'axios';

const timeout = Number(import.meta.env.VITE_API_TIMEOUT || 10000);

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: Number.isFinite(timeout) ? timeout : 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token') || import.meta.env.VITE_API_TOKEN;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      sessionStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  },
);
