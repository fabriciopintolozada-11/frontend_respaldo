import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../../shared/components/ToastContext';
import type { WorkOrder } from '../../../shared/types/openapi';
import { isDiagnosticEligible, MechanicConsoleView } from '../../mechanic/pages/MechanicConsoleView';
import { DiagnosticForm, type DiagnosticFormProps } from './DiagnosticForm';

const assignedOrder: WorkOrder = {
  id: 'order-1',
  code: 'OT-2026-001',
  vehiclePlate: 'ABC-123',
  vehicleBrand: 'Toyota',
  vehicleModel: 'Corolla',
  vehicleYear: 2022,
  clientName: '',
  clientDocument: '',
  clientPhone: '',
  status: 'RECIBIDO' as WorkOrder['status'],
  entryDate: '2026-08-31T10:00:00.000Z',
  entryReason: 'Ruido al frenar',
  laborItems: [],
  partsItems: [],
  totalLaborBOB: 0,
  totalPartsBOB: 0,
  totalGeneralBOB: 0,
  lastClientContactDate: '2026-08-31',
  daysWithoutClientResponse: 0,
  hasPendingAdditionalWork: false,
  isSuspendedForAdditionalWork: false,
  statusHistory: [],
};

vi.mock('../../mechanic/api/useMechanicOrders', () => ({
  useMechanicOrders: () => ({
    data: { success: true, data: [assignedOrder], timestamp: '2026-08-31T10:00:00.000Z' },
    isPending: false,
    isError: false,
  }),
}));

const defaultProps: DiagnosticFormProps = {
  order: {
    id: 'order-1',
    code: 'OT-2026-001',
    plate: 'ABC-123',
    status: 'RECIBIDO',
    initialComplaint: 'Ruido al frenar',
    vehicleDescription: 'Toyota Corolla',
  },
  parts: [
    { id: 'part-1', code: 'FRE-001', name: 'Pastillas de freno' },
    { id: 'part-2', code: 'PAR-002', name: 'Amortiguador delantero' },
  ],
  onCancel: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

describe('DiagnosticForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the action for an eligible assigned order and opens the form with its context', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MechanicConsoleView />);

    const action = screen.getByRole('button', { name: 'Registrar diagnóstico' });
    expect(action).toBeInTheDocument();
    await user.click(action);

    expect(screen.getByRole('dialog', { name: 'Registrar diagnóstico técnico' })).toBeInTheDocument();
    expect(screen.getAllByText('OT-2026-001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ABC-123').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ruido al frenar').length).toBeGreaterThan(0);
    expect(screen.getByText('El registro aún no está disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar diagnóstico' })).toBeDisabled();
    expect(document.body.textContent).not.toMatch(/precio|tarifa|subtotal|\btotal\b|\bBOB\b|Bs\./i);
    expect(document.body.textContent).not.toMatch(/HU-\d+|US-\d+|RN-\d+|MOCK/i);
  });

  it('limits initial diagnosis access to received and diagnosis states', () => {
    expect(isDiagnosticEligible('RECIBIDO')).toBe(true);
    expect(isDiagnosticEligible('en_diagnostico')).toBe(true);
    expect(isDiagnosticEligible('EN_REPARACION')).toBe(false);
    expect(isDiagnosticEligible('FINALIZADA')).toBe(false);
  });

  it.each([
    ['', 'Describe las fallas detectadas.'],
    ['   ', 'Describe las fallas detectadas.'],
  ])('rejects an empty or blank description', async (description, expectedMessage) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    if (description) await user.type(screen.getByLabelText(/Fallas detectadas/), description);
    await user.click(screen.getByRole('button', { name: 'Confirmar diagnóstico' }));

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates invalid estimated hours', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText(/Fallas detectadas/), 'Pastillas desgastadas');
    const hours = screen.getByLabelText(/Horas estimadas/);
    await user.clear(hours);
    await user.type(hours, '-1');
    await user.click(screen.getByRole('button', { name: 'Confirmar diagnóstico' }));

    expect(await screen.findByText('Las horas estimadas no pueden ser negativas.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits suggested tasks and selected catalog parts without exposing monetary information', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText(/Fallas detectadas/), 'Discos rayados');
    await user.clear(screen.getByLabelText(/Horas estimadas/));
    await user.type(screen.getByLabelText(/Horas estimadas/), '2.5');
    await user.type(screen.getByLabelText('Tarea sugerida 1'), 'Rectificar discos');
    await user.click(screen.getByText('Pastillas de freno'));

    const visibleText = document.body.textContent ?? '';
    expect(visibleText).not.toMatch(/precio|tarifa|subtotal|\btotal\b|\bBOB\b|Bs\./i);
    await user.click(screen.getByRole('button', { name: 'Confirmar diagnóstico' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      description: 'Discos rayados',
      estimatedHours: 2.5,
      suggestedTasks: ['Rectificar discos'],
      suggestedPartIds: ['part-1'],
    });
    expect(await screen.findByText('Diagnóstico registrado correctamente.')).toBeInTheDocument();
  });

  it('prevents a second submit while the first request is pending', async () => {
    const user = userEvent.setup();
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => { resolveSubmit = resolve; }));
    renderForm({ onSubmit });

    await user.type(screen.getByLabelText(/Fallas detectadas/), 'Fuga en el circuito');
    const submitButton = screen.getByRole('button', { name: 'Confirmar diagnóstico' });
    await user.click(submitButton);

    expect(await screen.findByRole('button', { name: /Cargando/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Cargando/ }));
    expect(onSubmit).toHaveBeenCalledOnce();
    resolveSubmit?.();
    expect(await screen.findByText('Diagnóstico registrado correctamente.')).toBeInTheDocument();
  });

  it('keeps entered data when submission fails', async () => {
    const user = userEvent.setup();
    renderForm({ onSubmit: vi.fn().mockRejectedValue(new Error('El servicio rechazó el registro.')) });

    const description = screen.getByLabelText(/Fallas detectadas/);
    await user.type(description, 'Falla intermitente del sensor');
    await user.click(screen.getByRole('button', { name: 'Confirmar diagnóstico' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El servicio rechazó el registro.');
    expect(description).toHaveValue('Falla intermitente del sensor');
  });

  it('does not render internal requirement identifiers', () => {
    renderForm();
    expect(document.body.textContent).not.toMatch(/HU-\d+|US-\d+|RN-\d+|MOCK/i);
  });
});

function renderForm(overrides: Partial<DiagnosticFormProps> = {}) {
  return render(<DiagnosticForm {...defaultProps} {...overrides} />);
}

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>,
  );
}
