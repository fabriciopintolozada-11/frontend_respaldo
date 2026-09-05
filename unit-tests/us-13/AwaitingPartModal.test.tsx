import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AwaitingPartModal } from '../../src/features/mechanic-view/components/AwaitingPartModal';

import type { AssignedWorkOrderDetail } from '../../src/features/mechanic-view/api/types';

const order: AssignedWorkOrderDetail = {
  id: 'order-12345678',
  vehicleId: 'vehicle-1',
  plate: 'ABC-123',
  status: 'EN_REPARACION',
  initialComplaint: 'Ruido en frenos',
  assignedAt: '2026-09-02T10:00:00.000Z',

  vehicle: {
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
  },

  tasks: [],

  parts: [
    {
      id: 'part-1',
      sparePartId: 'spare-part-1',
      partCode: 'FRE-001',
      description: 'Pastillas de freno',
      quantityRequired: 2,
      quantityUsed: 0,
      status: 'RESERVADO',
    },
    {
      id: 'part-2',
      sparePartId: 'spare-part-2',
      partCode: 'DIS-002',
      description: 'Disco de freno',
      quantityRequired: 1,
      quantityUsed: 0,
      status: 'PENDIENTE',
    },
  ],

  diagnosticReport: 'Pastillas desgastadas',

  statusHistory: [],
};

describe('AwaitingPartModal', () => {
  it('shows only parts associated with the work order', () => {
    render(
      <AwaitingPartModal
        isOpen
        order={order}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.getByRole('dialog', {
        name: 'En espera de repuesto',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', {
        name: 'FRE-001 - Pastillas de freno',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', {
        name: 'DIS-002 - Disco de freno',
      }),
    ).toBeInTheDocument();

    expect(document.body.textContent).not.toMatch(
      /precio|tarifa|subtotal|\btotal\b|\bBOB\b|Bs\./i,
    );
  });

  it('does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <AwaitingPartModal
        isOpen
        order={order}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    const quantityInput = screen.getByLabelText(
      /Cantidad faltante/i,
    );

    await user.clear(quantityInput);

    await user.click(
      screen.getByRole('button', {
        name: 'Confirmar espera',
      }),
    );

    expect(
      await screen.findByText(
        'Selecciona el repuesto faltante',
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Ingresa el motivo de la espera',
      ),
    ).toBeInTheDocument();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the official US-13 payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockResolvedValue(undefined);

    render(
      <AwaitingPartModal
        isOpen
        order={order}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(/Repuesto faltante/i),
      'spare-part-1',
    );

    const quantityInput = screen.getByLabelText(
      /Cantidad faltante/i,
    );

    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    await user.type(
      screen.getByLabelText(/Motivo/i),
      'No se encuentra físicamente en almacén',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Confirmar espera',
      }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      'order-12345678',
      {
        missingPartId: 'spare-part-1',
        quantity: 2,
        reason:
          'No se encuentra físicamente en almacén',
      },
    );
  });

  it('disables confirmation when the work order has no associated parts', () => {
    const orderWithoutParts: AssignedWorkOrderDetail = {
      ...order,
      parts: [],
    };

    render(
      <AwaitingPartModal
        isOpen
        order={orderWithoutParts}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.getByText(
        'Esta OT no tiene repuestos asociados.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Confirmar espera',
      }),
    ).toBeDisabled();
  });
});