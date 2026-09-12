import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApplyDiscountModal } from './ApplyDiscountModal';

function renderModal(overrides: Partial<Parameters<typeof ApplyDiscountModal>[number]> = {}) {
  const base = {
    isOpen: true,
    plate: 'ABC1234',
    availableTotal: '1191.00',
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  const props = { ...base, ...overrides };
  render(<ApplyDiscountModal {...props} />);
  return props;
}

describe('ApplyDiscountModal (US-20 / RN-15)', () => {
  it('renders the discount form with the plate and available total', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: /Aplicar descuento/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ABC1234/)).toBeInTheDocument();
    expect(screen.getByText(/1.191,00/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto del descuento \(BOB\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo del descuento/i)).toBeInTheDocument();
  });

  it('requires the amount and a 10-character minimum reason (RN-15)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.click(screen.getByRole('button', { name: /^Aplicar Descuento$/ }));

    expect(
      await screen.findByText('Ingresa el monto del descuento.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Mínimo 10 caracteres')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects more than 2 decimal places (backend contract bound)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(screen.getByLabelText(/Monto del descuento \(BOB\)/i), '50.125');
    await user.type(
      screen.getByLabelText(/Motivo del descuento/i),
      'Descuento por servicio incompleto',
    );
    await user.click(screen.getByRole('button', { name: /^Aplicar Descuento$/ }));

    expect(await screen.findByText('Máximo 2 decimales')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed reason and numeric amount (US-20 Gherkin)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(screen.getByLabelText(/Monto del descuento \(BOB\)/i), '50.5');
    await user.type(
      screen.getByLabelText(/Motivo del descuento/i),
      '  Descuento por servicio incompleto  ',
    );
    await user.click(screen.getByRole('button', { name: /^Aplicar Descuento$/ }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      amount: 50.5,
      reason: 'Descuento por servicio incompleto',
    });
  });

  it('disables the actions while the discount is pending (FE-09)', () => {
    renderModal({ isPending: true });

    expect(
      screen.getByRole('button', { name: /Cargando\.\.\./ }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /^Cancelar$/ }),
    ).toBeDisabled();
  });

  it('calls onClose and never submits when cancelled', async () => {
    const user = userEvent.setup();
    const { onClose, onSubmit } = renderModal();

    await user.click(screen.getByRole('button', { name: /^Cancelar$/ }));

    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});