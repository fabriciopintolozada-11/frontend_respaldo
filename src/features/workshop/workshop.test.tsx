import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { ToastProvider } from '../../shared/components/ToastContext';
import { WorkshopProvider } from '../../state/WorkshopContext';
import { resetStorageToSeed } from '../../services/mock-db';
import { workshopService } from '../../services/workshop-service';
import { WorkshopHeadView } from './WorkshopHeadView';
import { MechanicConsoleView as WorkshopMechanicView } from './MechanicConsoleView';
import { WorkOrderDetailView } from './WorkOrderDetailView';
import { MechanicConsoleView } from '../mechanic-view/pages/MechanicConsoleView';

vi.mock('../mechanic-view/api/mechanic-service', () => ({
  mechanicService: {
    getAssigned: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'ot-001',
          vehicleId: 'v-001',
          plate: 'OT-2025-0101',
          status: 'EN_PROGRESO',
          initialComplaint: 'Ruido en frenos delanteros',
          assignedAt: '2025-08-01T10:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
    getAssignedDetail: vi.fn().mockResolvedValue({
      id: 'ot-001',
      vehicleId: 'v-001',
      plate: 'OT-2025-0101',
      status: 'EN_PROGRESO',
      initialComplaint: 'Ruido en frenos delanteros',
      assignedAt: '2025-08-01T10:00:00.000Z',
      vehicle: { brand: 'Toyota', model: 'Corolla', year: 2020 },
      tasks: [
        { id: 't-1', description: 'Desmontar frenos', estimatedHours: 2, isCompleted: false },
      ],
      parts: [
        { id: 'p-1', partCode: 'REP-FR-001', description: 'Pastillas delanteras', quantityRequired: 1, quantityUsed: 0, status: 'PENDIENTE' },
      ],
      diagnosticReport: 'Desgaste avanzado en pastillas',
      statusHistory: [],
    }),
  },
}));

function queryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(initialEntry = '/taller') {
  return render(
    <ToastProvider>
      <WorkshopProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/taller" element={<WorkshopHeadView />} />
            <Route path="/mecanico" element={<WorkshopMechanicView />} />
            <Route path="/ots/:orderId" element={<WorkOrderDetailView />} />
          </Routes>
        </MemoryRouter>
      </WorkshopProvider>
    </ToastProvider>,
  );
}

function renderMechanicConsole(initialEntry = '/mecanico') {
  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient()}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/mecanico" element={<MechanicConsoleView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>,
  );
}

describe('HU-02 Gestión / Diagnóstico, Asignación de Bahías y OTs', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStorageToSeed();
  });

  it('muestra las 4 bahías operativas con su estado', async () => {
    renderWithProviders();

    expect(screen.getByText('BAHIA-01')).toBeInTheDocument();
    expect(screen.getByText('BAHIA-02')).toBeInTheDocument();
    expect(screen.getByText('BAHIA-03')).toBeInTheDocument();
    expect(screen.getByText('BAHIA-04')).toBeInTheDocument();

    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('En Pausa x Repuesto')).toBeInTheDocument();
    expect(screen.getAllByText('Ocupada')).not.toHaveLength(0);
  });

  it('asigna una OT a una bahía libre seleccionando OT y mecánico principal', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const assignButton = screen.getAllByRole('button', { name: /asignar ot a bahía/i })[0];
    await user.click(assignButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const otSelect = screen.getByLabelText(/seleccionar orden de trabajo en espera/i);
    await user.selectOptions(otSelect, 'OT-2025-0104');

    const mechanicSelect = screen.getByLabelText(/mecánico principal/i);
    await user.selectOptions(mechanicSelect, 'MEC-04');

    await user.click(screen.getByRole('button', { name: /confirmar asignación de bahía/i }));

    expect(await screen.findByText(/ot asignada con éxito/i)).toBeInTheDocument();

    const orders = workshopService.getAllWorkOrders();
    const assigned = orders.find((o) => o.code === 'OT-2025-0104');
    expect(assigned?.assignedBayId).toBe(4);
    expect(assigned?.primaryMechanicId).toBe('MEC-04');

    const bays = workshopService.getAllBays();
    const bay4 = bays.find((b) => b.id === 4);
    expect(bay4?.status).toBe('OCUPADA');
    expect(bay4?.currentWorkOrderId).toBe('OT-2025-0104');
  });

  it('rechaza asignar dos vehículos a la misma bahía (regla de validación)', () => {
    expect(() =>
      workshopService.assignBayAndMechanic('ot-004', 1, 'MEC-01'),
    ).toThrow(/ya está ocupada por la OT/i);
  });

  it('registra el diagnóstico técnico inicial y actualiza el estado a Diagnóstico Completado', () => {
    const result = workshopService.completeDiagnostic(
      'ot-007',
      {
        diagnosticReport: 'Fuga de aceite en retén de bancada. Se requiere kit completo.',
        mechanicNotes: 'Verificado con escáner y elevador.',
        laborItems: [{ description: 'Desmontaje y cambio de retén', estimatedHours: 4.5 }],
        partsItems: [{ partId: 'REP-MOT-004', quantityRequired: 1 }],
      },
      'Juan Carlos Mamani',
    );

    expect(result.status).toBe('DIAGNOSTICADA');
    expect(result.diagnosticReport).toContain('retén');
    expect(result.totalLaborBOB).toBe(540);
    expect(result.partsItems).toHaveLength(1);
    expect(result.statusHistory[0].status).toBe('DIAGNOSTICADA');

    const inventory = workshopService.getAllInventory();
    const reserved = inventory.find((i) => i.id === 'REP-MOT-004');
    expect(reserved?.stockReserved).toBe(2);
  });

  it('muestra la consola del mecánico con órdenes asignadas', async () => {
    renderMechanicConsole();

    expect(await screen.findByText(/mechanic console/i)).toBeInTheDocument();
    expect(screen.getByText(/technical view \(no costs\)/i)).toBeInTheDocument();
    expect(screen.getByText('OT-2025-0101')).toBeInTheDocument();
    expect(screen.getByText(/ruido en frenos delanteros/i)).toBeInTheDocument();
  });

  it('completa el diagnóstico desde el detalle de la OT', async () => {
    const user = userEvent.setup();
    renderWithProviders('/ots/ot-007');

    expect(screen.getByText('OT-2025-0107')).toBeInTheDocument();
    expect(screen.getAllByText(/1\. Registrada/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /registrar diagnóstico \(hu-02\)/i }));

    await user.type(
      screen.getByLabelText(/informe técnico de diagnóstico/i),
      'Bobina del cilindro 2 en falla. Se requiere cambio de bobinas y bujías.',
    );
    await user.click(screen.getByRole('button', { name: /completar diagnóstico$/i }));

    expect((await screen.findAllByText(/diagnóstico completado/i)).length).toBeGreaterThan(0);

    const updated = workshopService.getWorkOrderById('ot-007');
    expect(updated?.status).toBe('DIAGNOSTICADA');
    expect(updated?.diagnosticReport).toContain('Bobina');
  });
});