import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StaleQuoteBadge } from './StaleQuoteBadge';

describe('StaleQuoteBadge (FE-T16.1)', () => {
  it('no se muestra cuando isStaleQuote es falso', () => {
    const { container } = render(<StaleQuoteBadge isStaleQuote={false} daysWaitingApproval={17} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra la alerta fija y el número de días de espera recibido', () => {
    render(<StaleQuoteBadge isStaleQuote daysWaitingApproval={17} />);

    expect(screen.getByText(/alerta: 15\+ días sin respuesta/i)).toBeInTheDocument();
    expect(screen.getByText(/17 días/i)).toBeInTheDocument();
  });

  it('soporta la variante de advertencia (ámbar) predeterminada', () => {
    render(<StaleQuoteBadge isStaleQuote daysWaitingApproval={17} />);

    const badge = screen.getByText(/alerta: 15\+ días sin respuesta/i).closest('span');
    expect(badge?.className).toContain('F59E0B');
  });
});