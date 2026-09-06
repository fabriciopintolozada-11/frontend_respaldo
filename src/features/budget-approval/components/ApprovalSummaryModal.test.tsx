import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApprovalSummaryModal } from './ApprovalSummaryModal';

const items = [
  {
    id: 'labor-1',
    description: 'Diagnóstico de frenos',
    itemType: 'LABOR' as const,
    quantity: '2',
    unitPrice: '120.00',
    subtotal: '240.00',
    status: 'PROPOSED',
  },
];

const budget = {
  laborSubtotal: '200.00',
  partsSubtotal: '240.00',
  total: '440.00',
  currency: 'BOB',
};

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  isSubmitting: false,
  customerName: 'María Pérez',
  items,
  budget,
};

describe('ApprovalSummaryModal', () => {
  it('requires notes (RN-07 validation mirror) and sends approval channel and decision', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ApprovalSummaryModal {...baseProps} decision="APPROVED" onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByLabelText(/canal de comunicación/i), 'WHATSAPP');
    await user.click(screen.getByRole('button', { name: /confirmar aprobación/i }));

    expect(screen.getByText(/registra las notas de respaldo/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/notas de respaldo/i), 'Cliente confirmó por WhatsApp.');
    await user.click(screen.getByRole('button', { name: /confirmar aprobación/i }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'APPROVED',
      channel: 'WHATSAPP',
      notes: 'Cliente confirmó por WhatsApp.',
    }));
  });

  it('requires a rejection reason before submitting a rejection', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ApprovalSummaryModal {...baseProps} decision="REJECTED" onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: /confirmar rechazo/i }));

    expect(screen.getByText(/motivo del rechazo es obligatorio/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/motivo obligatorio del rechazo/i), 'Costo fuera del presupuesto del cliente.');
    await user.click(screen.getByRole('button', { name: /confirmar rechazo/i }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'REJECTED',
      reason: 'Costo fuera del presupuesto del cliente.',
    }));
  });

  it('never renders invented IVA or discount totals (US-09 real contract)', () => {
    render(<ApprovalSummaryModal {...baseProps} decision="APPROVED" onConfirm={vi.fn()} />);

    expect(screen.queryByText(/IVA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument();
    expect(screen.getByText(/maría pérez/i)).toBeInTheDocument();
    expect(screen.getByText('440,00 BOB')).toBeInTheDocument();
  });
});