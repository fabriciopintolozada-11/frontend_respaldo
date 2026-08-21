import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpClient } from '../shared/api/http-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    },
  },
});

function BackendUnavailable() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#0F1115', color: '#E0E2E6', textAlign: 'center' }}>
      <section>
        <h1>Backend no disponible</h1>
        <p>Inicia taller_back para utilizar el sistema.</p>
      </section>
    </main>
  );
}

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkBackend = async () => {
      try {
      await httpClient.get('/health', {
  headers: { 'Cache-Control': 'no-cache' },
});
        if (mounted) setBackendAvailable(true);
      } catch {
        if (mounted) setBackendAvailable(false);
      }
    };

    void checkBackend();
    const interval = window.setInterval(checkBackend, 3000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {backendAvailable ? children : <BackendUnavailable />}
    </QueryClientProvider>
  );
}
