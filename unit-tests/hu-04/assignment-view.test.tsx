import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, beforeAll, afterAll, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';

import { ToastProvider } from '../../src/shared/components/ToastContext';
import { WorkshopHeadView } from '../../src/features/workshop/WorkshopHeadView';
import { assignmentServer, resetAssignmentData } from './msw-assignment-handlers';

beforeAll(() => assignmentServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  assignmentServer.resetHandlers();
  resetAssignmentData();
});
afterAll(() => assignmentServer.close());

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <WorkshopHeadView />
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>,
  );
}

describe('WorkshopHeadView (HU-04)', () => {
  it('renders only the RECIBIDO orders pending assignment (RN-14)', async () => {
    renderView();

    expect(await screen.findByText('Panel del Jefe de Taller')).toBeInTheDocument();
    expect(await screen.findByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('XYZ-987')).toBeInTheDocument();
    expect(screen.getByText(/Cliente: Carlos Méndez/)).toBeInTheDocument();
    expect(screen.getByText('2 pendientes')).toBeInTheDocument();
  });

  it('lists only the active mechanics in the assignment pool (RN-14)', async () => {
    renderView();

    expect(await screen.findByText('Mecánico Uno')).toBeInTheDocument();
    expect(screen.getByText('Mecánico Dos')).toBeInTheDocument();
    expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
  });

  it('never renders financial fields (RN-16)', async () => {
    renderView();

    await screen.findByText('ABC-123');

    expect(screen.queryByText(/Bs\s/)).not.toBeInTheDocument();
    expect(screen.queryByText(/BOB/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$[0-9]/)).not.toBeInTheDocument();
  });

  it('assigns a pending order to an active mechanic through the modal (HU-04)', async () => {
    const user = userEvent.setup();
    renderView();

    await screen.findByText('ABC-123');
    await user.click(screen.getAllByRole('button', { name: /asignar ot/i })[0]);

    expect(screen.getByText('Asignar Orden de Trabajo')).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText(/Mecánico Activo/),
      '22222222-2222-4222-8222-222222222202',
    );
    await user.click(screen.getByRole('button', { name: 'Confirmar Asignación' }));

    expect(await screen.findByText('OT Asignada')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('ABC-123')).not.toBeInTheDocument());
  });

  it('shows the empty state when there are no pending orders', async () => {
    const { http, HttpResponse } = await import('msw');
    assignmentServer.use(
      http.get('/api/v1/work-orders', () =>
        HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 }),
      ),
    );

    renderView();

    expect(
      await screen.findByText('Sin órdenes pendientes de asignación'),
    ).toBeInTheDocument();
  });

  it('shows the error state with a retry action (FE-13)', async () => {
    const { http, HttpResponse } = await import('msw');
    assignmentServer.use(
      http.get('/api/v1/work-orders', () =>
        HttpResponse.json(
          { statusCode: 500, message: 'Internal server error' },
          { status: 500 },
        ),
      ),
    );

    renderView();

    expect(
      await screen.findByText('Internal server error', undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});