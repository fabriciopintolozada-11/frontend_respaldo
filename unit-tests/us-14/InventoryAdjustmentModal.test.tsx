import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InventoryAdjustmentModal } from '../../src/features/inventory/components/InventoryAdjustmentModal';

const adjustmentTypes = [
  {
    value: 'BACKEND_TYPE',
    label: 'Tipo definido por backend',
  },
];

describe('InventoryAdjustmentModal', () => {
  it('shows the selected spare part', () => {
    render(
      <InventoryAdjustmentModal
        isOpen
        sparePartId="part-1"
        sparePartLabel="FRE-001 - Pastillas de freno"
        adjustmentTypes={adjustmentTypes}
        isPending={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('dialog', {
        name: 'Registrar ajuste físico',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('FRE-001 - Pastillas de freno'),
    ).toBeInTheDocument();
  });

  it('validates required type and reason', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <InventoryAdjustmentModal
        isOpen
        sparePartId="part-1"
        sparePartLabel="FRE-001 - Pastillas de freno"
        adjustmentTypes={adjustmentTypes}
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Guardar ajuste',
      }),
    );

    expect(
      await screen.findByText(
        'Selecciona el tipo de ajuste',
        { selector: 'p' },
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Ingresa el motivo del ajuste',
        { selector: 'p' },
      ),
    ).toBeInTheDocument();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the US-14 payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <InventoryAdjustmentModal
        isOpen
        sparePartId="part-1"
        sparePartLabel="FRE-001 - Pastillas de freno"
        adjustmentTypes={adjustmentTypes}
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const quantityInput = screen.getByLabelText(/Cantidad/i);

    await user.clear(quantityInput);
    await user.type(quantityInput, '3');

    await user.selectOptions(
      screen.getByLabelText(/Tipo de ajuste/i),
      'BACKEND_TYPE',
    );

    await user.type(
      screen.getByLabelText(/Motivo/i),
      'Diferencia encontrada durante conteo físico',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Guardar ajuste',
      }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      sparePartId: 'part-1',
      quantity: 3,
      type: 'BACKEND_TYPE',
      reason: 'Diferencia encontrada durante conteo físico',
    });
  });

  it('disables submission while backend adjustment types are unavailable', () => {
    render(
      <InventoryAdjustmentModal
        isOpen
        sparePartId="part-1"
        sparePartLabel="FRE-001 - Pastillas de freno"
        adjustmentTypes={[]}
        isPending={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        /Los tipos de ajuste estarán disponibles/i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Guardar ajuste',
      }),
    ).toBeDisabled();
  });
});