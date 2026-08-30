/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_API_TOKEN?: string;
  readonly VITE_DATA_SOURCE?: 'backend' | 'mock';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
