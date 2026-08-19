import axios from 'axios';

const timeout = Number(import.meta.env.VITE_API_TIMEOUT || 10000);

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: Number.isFinite(timeout) ? timeout : 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
