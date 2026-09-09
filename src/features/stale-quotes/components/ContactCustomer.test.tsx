import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContactCustomer, toWhatsAppNumber } from './ContactCustomer';

describe('toWhatsAppNumber', () => {
  it('limpia el teléfono a dígitos para el enlace de WhatsApp', () => {
    expect(toWhatsAppNumber('+591 70000000')).toBe('59170000000');
  });
});

describe('ContactCustomer (FE-T16.2)', () => {
  it('genera el enlace de llamada tel: con el teléfono recibido, sin inventar nada', () => {
    render(<ContactCustomer phone="+591 70000000" />);

    const callLink = screen.getByRole('link', { name: /llamar/i });
    expect(callLink).toHaveAttribute('href', 'tel:+59170000000');
  });

  it('genera el enlace rápido de WhatsApp usando los dígitos del teléfono recibido', () => {
    render(<ContactCustomer phone="+591 70000000" />);

    const whatsAppLink = screen.getByRole('link', { name: /whatsapp/i });
    expect(whatsAppLink).toHaveAttribute('href', 'https://wa.me/59170000000');
    expect(whatsAppLink).toHaveAttribute('target', '_blank');
  });

  it('no genera enlaces inválidos cuando no hay teléfono y deshabilita la acción', () => {
    render(<ContactCustomer />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/sin teléfono registrado/i)).toBeInTheDocument();
  });
});