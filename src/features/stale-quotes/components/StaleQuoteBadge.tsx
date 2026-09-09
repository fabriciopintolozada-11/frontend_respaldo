import { AlertTriangle } from 'lucide-react';

import { Badge } from '../../../shared/components/Badge';
import { STALE_QUOTE_ALERT_LABEL } from '../stale-quote.types';

export interface StaleQuoteBadgeProps {
  isStaleQuote?: boolean;
  daysWaitingApproval?: number;
  variant?: 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export function StaleQuoteBadge({
  isStaleQuote = false,
  daysWaitingApproval = 0,
  variant = 'warning',
  size = 'sm',
  className = '',
}: StaleQuoteBadgeProps) {
  if (!isStaleQuote) return null;

  return (
    <Badge variant={variant} size={size} className={className}>
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {STALE_QUOTE_ALERT_LABEL} ({daysWaitingApproval} días)
    </Badge>
  );
}