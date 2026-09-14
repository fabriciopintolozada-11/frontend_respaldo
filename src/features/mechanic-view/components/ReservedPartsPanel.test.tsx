import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReservedPartsPanel } from './ReservedPartsPanel';
import type { ReservedPart } from '../api/types';

const parts: ReservedPart[] = [
  {
    id: 'wop-01',
    workOrderPartId: 'wop-01',
    code: 'REP-FRE-001',
    name: 'Pastillas de Freno',
    quantityReserved: 5,
    quantityUsed: 2,
    status: 'RESERVED',
  },
  {
    id: 'wop-02',
    workOrderPartId: 'wop-02',
    code: 'REP-TRA-002',
    name: 'Aceite de Transmisión',
    quantityReserved: 3,
    quantityUsed: 1,
    status: 'RESERVED',
  },
];

describe('ReservedPartsPanel (mechanic-view)', () => {
  it('shows the remaining pending units for partial consumption', () => {
    render(
      <ReservedPartsPanel
        parts={parts}
        workOrderId="ot-1"
        canConsume
        onConsume={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText('Pastillas de Freno')).toBeInTheDocument();
    expect(screen.getByText('Aceite de Transmisión')).toBeInTheDocument();
    // first part: 5 reserved - 2 used = 3 pending
    // second part: 3 reserved - 1 used = 2 pending
    expect(screen.getAllByText('Pendiente: 3 un.')).toHaveLength(1);
    expect(screen.getAllByText('Pendiente: 2 un.')).toHaveLength(1);
  });

  it('confirms a partial consume with the selected quantity (US-07 esc. 4)', async () => {
    const user = userEvent.setup();
    const onConsume = vi.fn();
    render(
      <ReservedPartsPanel
        parts={[parts[0]]}
        workOrderId="ot-1"
        canConsume
        onConsume={onConsume}
        isPending={false}
      />,
    );

    const qtyInput = screen.getByLabelText(/cantidad a instalar/i, {
      selector: '#qty-wop-01',
    });
    fireEvent.change(qtyInput, { target: { value: '2' } });

    await user.click(screen.getByRole('button', { name: /confirmar uso/i }));

    expect(onConsume).toHaveBeenCalledWith('ot-1', 'wop-01', 2);
  });

  it('renders the installed state without a consume action', () => {
    const installed: ReservedPart = { ...parts[0], status: 'INSTALLED', quantityUsed: 5 };
    render(
      <ReservedPartsPanel
        parts={[installed]}
        workOrderId="ot-1"
        canConsume
        onConsume={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText('Instalado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirmar uso/i })).not.toBeInTheDocument();
  });

  it('waits for approval when the order cannot consume yet', () => {
    render(
      <ReservedPartsPanel
        parts={[parts[0]]}
        workOrderId="ot-1"
        canConsume={false}
        onConsume={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText('En espera de aprobación')).toBeInTheDocument();
  });

  it('sends the workOrderPartId identifier to the consume callback', async () => {
    const user = userEvent.setup();
    const onConsume = vi.fn();
    render(
      <ReservedPartsPanel
        parts={[parts[0]]}
        workOrderId="ot-1"
        canConsume
        onConsume={onConsume}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /confirmar uso/i }));

    expect(onConsume).toHaveBeenCalledWith('ot-1', 'wop-01', 3);
  });
});