import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResolveAdditionalFindingModal } from './ResolveAdditionalFindingModal';

const ORDER = { plate: 'ABC123', findingDescription: 'Fuga de aceite en el cárter.' };

function renderModal(onConfirm = vi.fn(), isPending = false) {
  return render(
    <ResolveAdditionalFindingModal
      isOpen
      order={ORDER}
      onClose={vi.fn()}
      onConfirm={onConfirm}
      isPending={isPending}
    />,
  );
}

describe('ResolveAdditionalFindingModal (US-21 / FE-T21.2)', () => {
  it('renders the finding description and the two clear options (FE-20)', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: /Resolver ampliación de presupuesto/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fuga de aceite en el cárter\./)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Aprobar ampliación/i })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /Rechazar y continuar reparación base/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar aprobación/i })).toBeInTheDocument();
  });

  it('never shows internal requirement codes in the UI (approve and reject views)', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(document.body.textContent).not.toMatch(/HU-\d+|US-\d+|RN-\d+|FE-\d+/i);

    await user.click(
      screen.getByRole('radio', { name: /Rechazar y continuar reparación base/i }),
    );

    expect(document.body.textContent).not.toMatch(/HU-\d+|US-\d+|RN-\d+|FE-\d+/i);
  });

  it('approves with channel, customer name and notes (HU-09 / RN-07)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderModal(onConfirm);

    await user.type(
      screen.getByLabelText(/Cliente que autoriza/i),
      'Juan Pérez',
    );
    await user.selectOptions(screen.getByLabelText(/Canal de comunicación/i), 'WHATSAPP');
    await user.type(
      screen.getByLabelText(/Notas de respaldo/i),
      'Cliente confirmó el alcance por WhatsApp.',
    );
    await user.click(screen.getByRole('button', { name: /Confirmar aprobación/i }));

    expect(onConfirm).toHaveBeenCalledWith({
      decision: 'APPROVE',
      channel: 'WHATSAPP',
      customerName: 'Juan Pérez',
      notes: 'Cliente confirmó el alcance por WhatsApp.',
      reason: '',
    });
  });

  it('rejects with a reason (RN-19)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderModal(onConfirm);

    await user.click(
      screen.getByRole('radio', { name: /Rechazar y continuar reparación base/i }),
    );
    await user.type(
      screen.getByLabelText(/Motivo del rechazo/i),
      'El cliente prefiere reparar la falla en otro taller.',
    );
    await user.click(screen.getByRole('button', { name: /Confirmar rechazo/i }));

    expect(onConfirm).toHaveBeenCalledWith({
      decision: 'REJECT',
      channel: 'CALL',
      customerName: '',
      notes: '',
      reason: 'El cliente prefiere reparar la falla en otro taller.',
    });
  });

  it('validates the approval fields before submitting (FE-11)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderModal(onConfirm);

    await user.click(screen.getByRole('button', { name: /Confirmar aprobación/i }));

    expect(await screen.findByText(/nombre del cliente que autoriza/i)).toBeInTheDocument();
    expect(screen.getByText(/notas de respaldo \(mínimo 3 caracteres\)/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('requires a reason of at least 3 non-whitespace characters when rejecting', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderModal(onConfirm);

    await user.click(
      screen.getByRole('radio', { name: /Rechazar y continuar reparación base/i }),
    );
    await user.type(screen.getByLabelText(/Motivo del rechazo/i), 'ab');
    await user.click(screen.getByRole('button', { name: /Confirmar rechazo/i }));

    expect(await screen.findByText(/motivo del rechazo es obligatorio/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});