import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MechanicAdditionalFindingBanner } from './MechanicAdditionalFindingBanner';

describe('MechanicAdditionalFindingBanner (US-21 / FE-T21.3)', () => {
  it.each([
    ['PENDING_QUOTE', /Falla imprevista en espera de decisión/i],
    ['APPROVED', /Falla imprevista aprobada/i],
    ['REJECTED', /Falla imprevista rechazada/i],
  ] as const)('renders the %s status without any cost (RN-16)', (status, titleRegexp) => {
    render(<MechanicAdditionalFindingBanner status={status} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(titleRegexp)).toBeInTheDocument();
    expect(screen.queryByText(/\$\s*\d|Bs\./)).not.toBeInTheDocument();
  });

  it('renders nothing when there is no additional finding (NONE / undefined)', () => {
    const { container } = render(
      <MechanicAdditionalFindingBanner status={undefined} />,
    );
    expect(container).toBeEmptyDOMElement();

    const { container: noneContainer } = render(
      <MechanicAdditionalFindingBanner status="NONE" />,
    );
    expect(noneContainer).toBeEmptyDOMElement();
  });
});