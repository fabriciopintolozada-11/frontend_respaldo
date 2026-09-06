import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '../../../test/msw-handlers';
import { AuthContext, type AuthContextValue } from '../../auth/providers/AuthProvider';
import type { AuthUser } from '../../auth/api/auth-service';
import { ToastProvider } from '../../../shared/components/ToastContext';
import type { UserRole } from '../../../shared/types/openapi';
import { InventoryManagerView } from './InventoryManagerView';
import type { SparePart } from '../spare-parts.types';

const CATALOG_PATH = '/api/v1/spare-parts';

const sampleParts: SparePart[] = [
  {
    id: 'part-1',
    code: 'REP-MOT-001',
    name: 'Bujía NGK BPR6ES',
    category: 'MOTOR',
    unitPrice: '45.00',
    physicalStock: 10,
    availableStock: 8,
    reservedStock: 2,
    lastMovementAt: '2026-08-01T00:00:00.000Z',
    isActive: true,
  },
  {
    id: 'part-2',
    code: 'REP-FRE-002',
    name: 'Pastillas de Freno',
    category: 'FRENOS',
    unitPrice: '120.50',
    physicalStock: 2,
    availableStock: -2,
    reservedStock: 4,
    lastMovementAt: null,
    isActive: true,
  },
];

function makeParts(count: number): SparePart[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `part-${i}`,
    code: `REP-${String(i).padStart(3, '0')}`,
    name: `Repuesto ${i}`,
    category: 'MOTOR' as const,
    unitPrice: '10.00',
    physicalStock: 5,
    availableStock: 5,
    reservedStock: 0,
    lastMovementAt: '2026-08-01T00:00:00.000Z',
    isActive: true,
  }));
}

function renderInventory(role: UserRole) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const user: AuthUser = { id: 'usr-1', fullName: 'Test User', username: 'test', role };
  const authValue: AuthContextValue = {
    user,
    accessToken: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(async () => user),
    logout: vi.fn(),
    refreshSession: vi.fn(async () => true),
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ToastProvider>
    </AuthContext.Provider>
  );
  return render(<InventoryManagerView />, { wrapper });
}

describe('InventoryManagerView (US-23)', () => {
  it('renders catalog cards, availability badges and prices for WORKSHOP_LEAD (RN-16)', async () => {
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 })));

    renderInventory('WORKSHOP_LEAD');

    expect(await screen.findByText('Bujía NGK BPR6ES')).toBeInTheDocument();
    expect(screen.getByText('Pastillas de Freno')).toBeInTheDocument();
    expect(screen.getByText('REP-MOT-001')).toBeInTheDocument();
    expect(screen.getAllByText('Disponible').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sin Stock').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Precio oficial (BOB)')).toHaveLength(2);
    expect(screen.getByText(/45[.,]00 Bs\./)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Ajustar Stock' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Nuevo Repuesto' })).toBeInTheDocument();
  });

  it('hides price rows and management actions for MECHANIC (RN-16, US-23)', async () => {
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 })));

    renderInventory('MECHANIC');

    await screen.findByText('Bujía NGK BPR6ES');
    expect(screen.queryByText('Precio oficial (BOB)')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nuevo Repuesto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajustar Stock' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desactivar/i })).not.toBeInTheDocument();
  });

  it('filters the current page by available stock with the toggle (FE-T23.2)', async () => {
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 })));

    renderInventory('WORKSHOP_LEAD');

    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.click(screen.getByRole('button', { name: /ver solo sin stock/i }));

    expect(await screen.findByText('Pastillas de Freno')).toBeInTheDocument();
    expect(screen.queryByText('Bujía NGK BPR6ES')).not.toBeInTheDocument();
  });

  it('shows the confirmed empty state copy when the catalog is empty (FE-13)', async () => {
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 })));

    renderInventory('WORKSHOP_LEAD');

    expect(await screen.findByRole('heading', { name: 'No se encontraron repuestos' })).toBeInTheDocument();
    expect(screen.getByText('Ajusta la búsqueda, el filtro de categoría o el filtro de stock para encontrar resultados.')).toBeInTheDocument();
  });

  it('shows an error state and retries the catalog request on demand (FE-13)', async () => {
    let calls = 0;
    server.use(
      http.get(CATALOG_PATH, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
        }
        return HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 });
      }),
    );

    renderInventory('WORKSHOP_LEAD');

    expect(await screen.findByText('No se pudo conectar con el catálogo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText('Bujía NGK BPR6ES')).toBeInTheDocument();
  });

  it('debounces the search input at 300 ms and sends the search param (FE-15)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(CATALOG_PATH, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 });
      }),
    );

    renderInventory('WORKSHOP_LEAD');
    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.type(screen.getByPlaceholderText(/buscar por código/i), 'REP-FRE');

    await waitFor(() => expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('search=REP-FRE')));
  });

  it('paginates using the backend page/pageSize contract (FE-T23.3)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(CATALOG_PATH, ({ request }) => {
        urlSpy(request.url);
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? 1);
        const data = makeParts(25).slice((page - 1) * 20, page * 20);
        return HttpResponse.json({ data, total: 25, page, pageSize: 20 });
      }),
    );

    renderInventory('WORKSHOP_LEAD');

    await screen.findByText('25 repuestos · Página 1 de 2');

    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('page=2')));
    expect(await screen.findByText('25 repuestos · Página 2 de 2')).toBeInTheDocument();
  });

  it('validates the creation form before submitting (FE-T23.5)', async () => {
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 })));

    renderInventory('WORKSHOP_LEAD');
    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo Repuesto' }));

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo Repuesto' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear Repuesto' }));

    expect(await within(dialog).findByText('El código es obligatorio')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Nuevo Repuesto' })).toBeInTheDocument();
  });

  it('creates a spare part posting the documented payload and shows a success toast (BE-T23.6)', async () => {
    const bodySpy = vi.fn();
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 })));
    server.use(
      http.post(CATALOG_PATH, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(
          {
            id: 'part-3',
            code: 'REP-ELC-004',
            name: 'Bujía Nova',
            category: 'ELECTRICO_LUCES',
            unitPrice: '45.50',
            physicalStock: 20,
            availableStock: 20,
            reservedStock: 0,
            isActive: true,
          },
          { status: 201 },
        );
      }),
    );

    renderInventory('WORKSHOP_LEAD');
    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo Repuesto' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo Repuesto' });

    await userEvent.type(within(dialog).getByPlaceholderText('Ej: REP-ELC-004'), 'REP-ELC-004');
    await userEvent.type(within(dialog).getByPlaceholderText('Ej: Bujía NGK BPR6ES'), 'Bujía Nova');
    await userEvent.type(within(dialog).getByPlaceholderText('Ej: 45.00'), '45.50');
    await userEvent.type(within(dialog).getByPlaceholderText('Ej: 20'), '20');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear Repuesto' }));

    await waitFor(() => {
      expect(bodySpy).toHaveBeenCalledWith({
        code: 'REP-ELC-004',
        name: 'Bujía Nova',
        category: 'MOTOR',
        unitPrice: 45.5,
        initialStock: 20,
      });
    });
    expect(await screen.findByText('Repuesto Creado')).toBeInTheDocument();
  });

  it('validates the adjustment reason and registers positives with the updated snapshot (US-14)', async () => {
    const bodySpy = vi.fn();
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 })));
    server.use(
      http.post(`${CATALOG_PATH}/adjustments`, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(
          {
            id: 'part-1',
            code: 'REP-MOT-001',
            name: 'Bujía NGK BPR6ES',
            category: 'MOTOR',
            unitPrice: '45.00',
            physicalStock: 13,
            availableStock: 11,
            reservedStock: 2,
            lastMovementAt: '2026-09-01T00:00:00.000Z',
            isActive: true,
          },
          { status: 201 },
        );
      }),
    );

    renderInventory('WORKSHOP_LEAD');
    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.click(screen.getAllByRole('button', { name: 'Ajustar Stock' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Registrar Ajuste de Stock' });

    await userEvent.type(within(dialog).getByPlaceholderText(/Conteo físico/i), 'corto');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar Ajuste' }));
    expect(await within(dialog).findByText('La razón debe tener al menos 10 caracteres')).toBeInTheDocument();

    await userEvent.clear(within(dialog).getByPlaceholderText(/Conteo físico/i));
    await userEvent.type(within(dialog).getByPlaceholderText(/Conteo físico/i), 'Conteo físico detectó unidades adicionales.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar Ajuste' }));

    await waitFor(() => {
      expect(bodySpy).toHaveBeenCalledWith({
        sparePartId: 'part-1',
        quantity: 1,
        type: 'POSITIVE',
        reason: 'Conteo físico detectó unidades adicionales.',
      });
    });
    expect(await screen.findByText('Ajuste Registrado')).toBeInTheDocument();
    expect(screen.getByText('Bujía NGK BPR6ES: stock físico actualizado a 13 unidades.')).toBeInTheDocument();
  });

  it('deactivates through the internal confirm modal instead of window.confirm (RN-19)', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const urlSpy = vi.fn();
    server.use(http.get(CATALOG_PATH, () => HttpResponse.json({ data: sampleParts, total: 2, page: 1, pageSize: 20 })));
    server.use(
      http.post(`${CATALOG_PATH}/part-1/deactivate`, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json({ ...sampleParts[0], isActive: false });
      }),
    );

    renderInventory('WORKSHOP_LEAD');
    await screen.findByText('Bujía NGK BPR6ES');

    await userEvent.click(screen.getAllByRole('button', { name: 'Desactivar' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Desactivar Repuesto' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Desactivar Repuesto' }));

    await waitFor(() => expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('/spare-parts/part-1/deactivate')));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(await screen.findByText('Repuesto Desactivado')).toBeInTheDocument();
  });
});