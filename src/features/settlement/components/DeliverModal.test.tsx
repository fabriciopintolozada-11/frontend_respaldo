import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeliverModal } from './DeliverModal';

function renderModal(overrides: Partial<Parameters<typeof DeliverModal>[number]> = {}) {
  const base = {
    isOpen: true,
    plate: 'ABC1234',
    totalToCharge: '1141.00',
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  const props = { ...base, ...overrides };
  render(<DeliverModal {...props} />);
  return props;
}

describe('DeliverModal (US-20 / RN-21)', () => {
  it('renders the delivery form with the plate and total to charge', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: /Entregar vehículo y cobrar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ABC1234/)).toBeInTheDocument();
    expect(
      screen.getAllByText('1.141,00 BOB').length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('group', { name: /Método de pago/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Efectivo$/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/Número de comprobante/i)).toBeInTheDocument();
  });

  it('switches the payment method when another option is selected (BE-13)', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /^QR \/ Transferencia$/ }));

    expect(
      screen.getByRole('button', { name: /^QR \/ Transferencia$/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Efectivo$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('requires a receipt number before confirming (RN-21)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.click(screen.getByRole('button', { name: /^Confirmar Entrega$/ }));

    expect(await screen.findByText('Ingresa el número de comprobante.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the payment method, trimmed receipt and trimmed notes (US-20 Gherkin)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(
      screen.getByLabelText(/Monto recibido \(BOB\)/i),
      '1200.00',
    );
    await user.type(
      screen.getByLabelText(/Número de comprobante/i),
      '  REC-045  ',
    );
    await user.type(
      screen.getByLabelText(/Notas de entrega \(opcional\)/i),
      'Cliente satisfecho',
    );
    await user.click(screen.getByRole('button', { name: /^Confirmar Entrega$/ }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      paymentMethod: 'CASH',
      receiptNumber: 'REC-045',
      deliveryNotes: 'Cliente satisfecho',
    });
  });

  it('computes the cash change while the received amount is entered (FE-T20.1)', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Monto recibido \(BOB\)/i), '1200');

    expect(await screen.findByText('59,00 BOB')).toBeInTheDocument();
  });

  it('requires the received amount for cash payments (FE-T20.1)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(screen.getByLabelText(/Número de comprobante/i), 'REC-010');
    await user.click(screen.getByRole('button', { name: /^Confirmar Entrega$/ }));

    expect(
      await screen.findByText('Ingresa el monto recibido.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a received amount lower than the total to charge (FE-T20.1)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(screen.getByLabelText(/Monto recibido \(BOB\)/i), '500');
    await user.type(screen.getByLabelText(/Número de comprobante/i), 'REC-011');
    await user.click(screen.getByRole('button', { name: /^Confirmar Entrega$/ }));

    expect(
      await screen.findByText('El monto recibido es menor al total a cobrar.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides the cash received amount for non-cash methods (FE-T20.1)', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /^QR \/ Transferencia$/ }));

    expect(
      screen.queryByLabelText(/Monto recibido \(BOB\)/i),
    ).not.toBeInTheDocument();
  });

  it('omits deliveryNotes and sends the selected method when fields are blank (RN-21)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.click(screen.getByRole('button', { name: /^QR \/ Transferencia$/ }));
    await user.type(screen.getByLabelText(/Número de comprobante/i), 'REC-002');
    await user.click(screen.getByRole('button', { name: /^Confirmar Entrega$/ }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      paymentMethod: 'QR_TRANSFER',
      receiptNumber: 'REC-002',
      deliveryNotes: undefined,
    });
  });

  it('disables the actions while the delivery is pending (FE-09)', () => {
    renderModal({ isPending: true });

    expect(
      screen.getByRole('button', { name: /Cargando\.\.\./ }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /^Cancelar$/ }),
    ).toBeDisabled();
  });
});