import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildOnlyStaleQuotesQueryString } from '../only-stale-quotes';
import { OnlyStaleQuotesFilter } from './OnlyStaleQuotesFilter';

describe('OnlyStaleQuotesFilter (FE-T16.3)', () => {
  it('refleja el boolean onlyStaleQuotes y notifica el toggle', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    const { rerender } = render(<OnlyStaleQuotesFilter checked={false} onToggle={onToggle} />);
    const control = screen.getByRole('switch');
    expect(control).toHaveAttribute('aria-checked', 'false');

    await user.click(control);
    expect(onToggle).toHaveBeenCalledWith(true);

    rerender(<OnlyStaleQuotesFilter checked onToggle={onToggle} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('muestra la etiqueta fija "Solo estancados (≥15 días)"', () => {
    render(<OnlyStaleQuotesFilter checked={false} onToggle={vi.fn()} />);

    expect(screen.getByText(/solo estancados \(≥15 días\)/i)).toBeInTheDocument();
  });
});

describe('buildOnlyStaleQuotesQueryString', () => {
  it('prepara onlyStaleQuotes=true al activarse', () => {
    expect(buildOnlyStaleQuotesQueryString(true)).toBe('onlyStaleQuotes=true');
  });

  it('prepara onlyStaleQuotes=false o ausencia del parámetro al desactivarse', () => {
    expect(buildOnlyStaleQuotesQueryString(false)).toBe('onlyStaleQuotes=false');
    expect(buildOnlyStaleQuotesQueryString(undefined)).toBe('');
  });
});