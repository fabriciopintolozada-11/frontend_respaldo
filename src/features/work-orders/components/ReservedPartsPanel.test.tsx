import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ReservedPartsPanel,
  type ReservedPartLine,
} from './ReservedPartsPanel';

const parts: ReservedPartLine[] = [
  {
    quotePartId: 'qp-01',
    id: 'pot-02',
    code: 'REP-FRE-001',
    name: 'Pastillas de Freno',
    reservedQuantity: 2,
    usedQuantity: 0,
    status: 'RESERVADO',
    unitPriceBOB: 390,
  },
  {
    quotePartId: 'qp-02',
    id: 'pot-06',
    code: 'REP-TRA-002',
    name: 'Aceite de Transmisión',
    reservedQuantity: 3,
    usedQuantity: 1,
    status: 'RESERVADO',
    unitPriceBOB: 140,
  },
];

describe('ReservedPartsPanel', () => {
  it('renders an informative state when parts data is unavailable (Opción A)', () => {
    render(<ReservedPartsPanel parts={null} userRole="MECHANIC" onConfirm={vi.fn()} />);

    expect(
      screen.getByText(/se mostrarán aquí cuando estén disponibles desde el backend/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirmar uso/i })).not.toBeInTheDocument();
  });

  it('renders the same informative state when parts is undefined', () => {
    render(<ReservedPartsPanel parts={undefined} userRole="MECHANIC" onConfirm={vi.fn()} />);

    expect(
      screen.getByText(/se mostrarán aquí cuando estén disponibles desde el backend/i),
    ).toBeInTheDocument();
  });

  it('renders the reserved parts with the remaining pending quantity', () => {
    render(<ReservedPartsPanel parts={parts} userRole="MECHANIC" onConfirm={vi.fn()} />);

    expect(screen.getByText('Pastillas de Freno')).toBeInTheDocument();
    expect(screen.getByText('Aceite de Transmisión')).toBeInTheDocument();
    // first part: 2 reserved - 0 used = 2 pending
    // second part: 3 reserved - 1 used = 2 pending
    expect(screen.getAllByText('2 un.')).toHaveLength(2);
  });

  it('hides prices for a MECHANIC (RN-16 / FE-T07.3)', () => {
    render(<ReservedPartsPanel parts={parts} userRole="MECHANIC" onConfirm={vi.fn()} />);

    expect(screen.queryByText(/Bs\.\/un\./)).not.toBeInTheDocument();
    expect(screen.queryByText('390 Bs./un.')).not.toBeInTheDocument();
  });

  it('shows prices for a WORKSHOP_LEAD (RN-16)', () => {
    render(<ReservedPartsPanel parts={parts} userRole="WORKSHOP_LEAD" onConfirm={vi.fn()} />);

    expect(screen.getByText('390 Bs./un.')).toBeInTheDocument();
    expect(screen.getByText('140 Bs./un.')).toBeInTheDocument();
  });

  it('calls onConfirm with the part and the selected quantity (FE-T07.1)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ReservedPartsPanel parts={parts} userRole="WORKSHOP_LEAD" onConfirm={onConfirm} />);

    const qtyInput = screen.getByLabelText(/Cantidad a instalar/i, {
      selector: '#qty-qp-01',
    });
    fireEvent.change(qtyInput, { target: { value: '1' } });

    // first reserved line corresponds to REP-FRE-001 / qp-01 (test data order)
    const confirmButtons = screen.getAllByRole('button', { name: /confirmar uso/i });
    await user.click(confirmButtons[0]);

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ quotePartId: 'qp-01' }),
      1,
    );
  });

  it('renders an empty state when every part is already installed', () => {
    const finishedPart: ReservedPartLine = {
      ...parts[0],
      reservedQuantity: 1,
      usedQuantity: 1,
    };
    render(
      <ReservedPartsPanel parts={[finishedPart]} userRole="WORKSHOP_LEAD" onConfirm={vi.fn()} />,
    );

    expect(
      screen.getByText(/No hay repuestos reservados pendientes de instalación para esta orden\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Confirmar uso/i)).not.toBeInTheDocument();
  });
});
