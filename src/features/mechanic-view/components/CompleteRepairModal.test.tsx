import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CompleteRepairModal } from './CompleteRepairModal';

const order = {
  id: '5f8f0b1a-c1b2-4a3d-9e4f-8a9b0c1d2e3f',
  plate: 'ABC-123',
};

function renderModal(overrides: Partial<Parameters<typeof CompleteRepairModal>[number]> = {}) {
  const base = {
    isOpen: true,
    order,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  const props = { ...base, ...overrides };
  render(<CompleteRepairModal {...props} />);
  return props;
}

describe('CompleteRepairModal (US-19)', () => {
  it('renders the closing context with the order code and plate (US-19)', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: /Concluir reparación/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/OT-5F8F0B1A · ABC-123/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Kilometraje final \(km\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Notas de control de calidad \(opcional\)/i),
    ).toBeInTheDocument();
  });

  it('requires the final mileage before submitting (FE-20)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.click(
      screen.getByRole('button', { name: /^Concluir Reparación$/ }),
    );

    expect(
      await screen.findByText('Ingresa el kilometraje final.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a mileage above 1,000,000 km (backend contract upper bound)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    const mileageInput = screen.getByLabelText(/Kilometraje final \(km\)/i);
    await user.type(mileageInput, '1000001');
    await user.click(
      screen.getByRole('button', { name: /^Concluir Reparación$/ }),
    );

    expect(
      await screen.findByText(/1,000,000 km/),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the mileage and trimmed closing notes (US-19 Gherkin)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(
      screen.getByLabelText(/Kilometraje final \(km\)/i),
      '125400',
    );
    await user.type(
      screen.getByLabelText(/Notas de control de calidad \(opcional\)/i),
      'Radiador reemplazado y probado en ruta',
    );
    await user.click(
      screen.getByRole('button', { name: /^Concluir Reparación$/ }),
    );

    expect(onSubmit).toHaveBeenCalledWith(order.id, {
      finalMileage: 125400,
      closingNotes: 'Radiador reemplazado y probado en ruta',
    });
    await waitForSubmit(onSubmit);
  });

  it('omits closingNotes when the user only typed whitespace', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(
      screen.getByLabelText(/Kilometraje final \(km\)/i),
      '89000',
    );
    await user.type(
      screen.getByLabelText(/Notas de control de calidad \(opcional\)/i),
      '   ',
    );
    await user.click(
      screen.getByRole('button', { name: /^Concluir Reparación$/ }),
    );

    expect(onSubmit).toHaveBeenCalledWith(order.id, {
      finalMileage: 89000,
      closingNotes: undefined,
    });
    await waitForSubmit(onSubmit);
  });

  it('caps the closing notes at 1000 characters (RN contract)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(
      screen.getByLabelText(/Kilometraje final \(km\)/i),
      '50000',
    );
    const longNotes = 'x'.repeat(1001) as string;
    fireEvent.change(
      screen.getByLabelText(/Notas de control de calidad \(opcional\)/i),
      { target: { value: longNotes } },
    );
    await user.click(
      screen.getByRole('button', { name: /^Concluir Reparación$/ }),
    );

    expect(
      await screen.findByText('Máximo 1000 caracteres'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the actions while the mutation is pending (FE-09)', async () => {
    renderModal({ isPending: true });

    const submitButton = screen.getByRole('button', {
      name: /Cargando\.\.\./,
    });
    expect(submitButton).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /^Cancelar$/ }),
    ).toBeDisabled();
  });

  it('calls onClose and never submits when cancelled (FE-20)', async () => {
    const user = userEvent.setup();
    const { onClose, onSubmit } = renderModal();

    await user.click(
      screen.getByRole('button', { name: /^Cancelar$/ }),
    );

    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

async function waitForSubmit(onSubmit: ReturnType<typeof vi.fn>) {
  await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
}