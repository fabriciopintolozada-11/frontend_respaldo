import { AlertTriangle } from 'lucide-react';

import { ONLY_STALE_QUOTES_FILTER_LABEL } from '../stale-quote.types';

export interface OnlyStaleQuotesFilterProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function OnlyStaleQuotesFilter({
  checked,
  onToggle,
  className = '',
  disabled = false,
}: OnlyStaleQuotesFilterProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      aria-label={ONLY_STALE_QUOTES_FILTER_LABEL}
      onClick={() => onToggle(!checked)}
      className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-150 select-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? 'border-[#F97316] bg-[#F97316] text-white'
          : 'border-[#2D3139] bg-[#0F1115] text-[#8E949F] hover:border-[#3D4149] hover:text-white'
      } ${className}`}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>{ONLY_STALE_QUOTES_FILTER_LABEL}</span>
    </button>
  );
}