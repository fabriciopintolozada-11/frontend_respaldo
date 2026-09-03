import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApprovalSummaryModal } from './ApprovalSummaryModal';

const items = [
  {
    id: 'labor-1',
    type: 'labor' as const,
    description: 'Diagnóstico de frenos',
    quantity: 2,
    unitPriceBOB: 120,
    totalBOB: 240,
    status: 'PENDING',
    isApproved: false,
    isElectricRestricted: false,
  },
];

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  items,
  approvedItemIds: ['labor-1'],
  subtotalBOB: 240,
  taxBOB: 31.2,
  discountBOB: 0,
  totalBOB: 271.2,
  isSubmitting: false,
};

describe('ApprovalSummaryModal', () => {
  it('requires notes and sends approval channel and decision', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ApprovalSummaryModal {...baseProps} decision="APROBADO" onConfirm={onConfirm} />);

    await user.selectOptions(screen.getByLabelText(/canal de comunicación/i), 'WHATSAPP');
    await user.click(screen.getByRole('button', { name: /confirmar aprobación/i }));

    expect(screen.getByText(/registra las notas de respaldo/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/notas de respaldo/i), 'Cliente confirmó por WhatsApp.');
    await user.click(screen.getByRole('button', { name: /confirmar aprobación/i }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'APROBADO',
      channel: 'WHATSAPP',
      notes: 'Cliente confirmó por WhatsApp.',
    }));
  });

  it('requires a rejection reason before submitting a rejection', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ApprovalSummaryModal {...baseProps} decision="RECHAZADO" onConfirm={onConfirm} />);

    await user.type(screen.getByLabelText(/notas de respaldo/i), 'Cliente no autoriza el trabajo.');
    await user.click(screen.getByRole('button', { name: /confirmar rechazo/i }));

    expect(screen.getByText(/motivo del rechazo es obligatorio/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/motivo obligatorio del rechazo/i), 'Costo fuera del presupuesto del cliente.');
    await user.click(screen.getByRole('button', { name: /confirmar rechazo/i }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'RECHAZADO',
      channel: 'CALL',
      rejectionReason: 'Costo fuera del presupuesto del cliente.',
    }));
  });
});
