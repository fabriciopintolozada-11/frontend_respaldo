import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '../../../test/msw-handlers';
import { InventoryAlertsView } from './InventoryAlertsView';
import type { InventoryAlert } from '../inventory-alerts.types';

const ALERTS_PATH = '/api/v1/inventory/alerts';

const sampleAlerts: InventoryAlert[] = [
  {
    partId: 'part-1',
    code: 'REP-MOT-001',
    name: 'Bujía NGK BPR6ES',
    category: 'MOTOR',
    physicalStock: 5,
    reservedStock: 0,
    availableStock: 5,
    daysWithoutMovement: 75,
    alertType: 'NO_ROTATION',
    lastMovementAt: '2026-06-10T00:00:00.000Z',
  },
  {
    partId: 'part-2',
    code: 'REP-FRE-002',
    name: 'Pastillas de Freno',
    category: 'FRENOS',
    physicalStock: 2,
    reservedStock: 4,
    availableStock: -2,
    daysWithoutMovement: 3,
    alertType: 'STOCK_OUT',
    lastMovementAt: null,
  },
];

function makeAlerts(count: number): InventoryAlert[] {
  return Array.from({ length: count }, (_, i) => ({
    partId: `part-${i}`,
    code: `REP-${String(i).padStart(3, '0')}`,
    name: `Repuesto ${i}`,
    category: 'MOTOR' as const,
    physicalStock: 5,
    reservedStock: 0,
    availableStock: 5,
    daysWithoutMovement: 75,
    alertType: (i % 2 === 0 ? 'NO_ROTATION' : 'STOCK_OUT') as InventoryAlert['alertType'],
    lastMovementAt: '2026-06-10T00:00:00.000Z',
  }));
}

function renderAlertsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<InventoryAlertsView />, { wrapper });
}

describe('InventoryAlertsView', () => {
  it('renders badges and stock details for NO_ROTATION and STOCK_OUT alerts (US-08, RN-10)', async () => {
    server.use(http.get(ALERTS_PATH, () => HttpResponse.json({ data: sampleAlerts, total: 2, page: 1, pageSize: 20 })));

    renderAlertsPage();

    expect(await screen.findByText('Bujía NGK BPR6ES')).toBeInTheDocument();
    expect(screen.getByText('Pastillas de Freno')).toBeInTheDocument();
    expect(screen.getByText('Sin Rotación / Estancado')).toBeInTheDocument();
    expect(screen.getByText('Stock Crítico / Insuficiente')).toBeInTheDocument();
    expect(screen.getByText('75 días')).toBeInTheDocument();
    expect(screen.getByText('Faltante estimado')).toBeInTheDocument();
    expect(screen.getByText('2 repuestos con alerta')).toBeInTheDocument();
  });

  it('shows the confirmed empty state copy when there are no alerts (FE-13)', async () => {
    server.use(http.get(ALERTS_PATH, () => HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 })));

    renderAlertsPage();

    expect(await screen.findByRole('heading', { name: 'Sin alertas de inventario' })).toBeInTheDocument();
    expect(screen.getByText('No se registran alertas de inventario ni repuestos estancados.')).toBeInTheDocument();
  });

  it('shows an error state and retries the request on demand (FE-13)', async () => {
    let calls = 0;
    server.use(
      http.get(ALERTS_PATH, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { statusCode: 500, message: 'Internal server error' },
            { status: 500 },
          );
        }
        return HttpResponse.json({ data: sampleAlerts, total: 2, page: 1, pageSize: 20 });
      }),
    );

    renderAlertsPage();

    expect(await screen.findByText('No se pudieron cargar las alertas')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText('Bujía NGK BPR6ES')).toBeInTheDocument();
  });

  it('filters by alert type sending the supported contract parameter (FE-T08.3)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(ALERTS_PATH, ({ request }) => {
        urlSpy(request.url);
        const url = new URL(request.url);
        const alertType = url.searchParams.get('alertType');
        const data = alertType ? sampleAlerts.filter((alert) => alert.alertType === alertType) : sampleAlerts;
        return HttpResponse.json({ data, total: data.length, page: 1, pageSize: 20 });
      }),
    );

    renderAlertsPage();
    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.click(screen.getByRole('button', { name: 'Stock Crítico' }));

    await waitFor(() => expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('alertType=STOCK_OUT')));
    expect(await screen.findByText('Pastillas de Freno')).toBeInTheDocument();
    expect(screen.queryByText('Bujía NGK BPR6ES')).not.toBeInTheDocument();
  });

  it('debounces the search input at 300 ms and sends the search parameter (FE-15)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(ALERTS_PATH, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json({ data: sampleAlerts, total: 2, page: 1, pageSize: 20 });
      }),
    );

    renderAlertsPage();
    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.type(screen.getByPlaceholderText(/buscar por código/i), 'REP-FRE');

    await waitFor(() => expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('search=REP-FRE')));
  });

  it('paginates using the backend page/pageSize contract (FE-T08.3)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(ALERTS_PATH, ({ request }) => {
        urlSpy(request.url);
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? 1);
        const data = makeAlerts(25).slice((page - 1) * 20, page * 20);
        return HttpResponse.json({ data, total: 25, page, pageSize: 20 });
      }),
    );

    renderAlertsPage();

    await screen.findByText('25 alertas · Página 1 de 2');

    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('page=2')));
    expect(await screen.findByText('25 alertas · Página 2 de 2')).toBeInTheDocument();
  });
});