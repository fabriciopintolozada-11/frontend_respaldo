const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT ?? 10_000);

export const env = {
  apiUrl: import.meta.env.VITE_API_URL?.trim() || '/api/v1',
  apiTimeout: Number.isFinite(apiTimeout) && apiTimeout > 0 ? apiTimeout : 10_000,
  apiToken: import.meta.env.MODE === 'test' ? undefined : import.meta.env.VITE_API_TOKEN?.trim() || undefined,
  dataSource: import.meta.env.VITE_DATA_SOURCE === 'mock' ? 'mock' : 'backend',
} as const;

export const isBackendMode = env.dataSource === 'backend';