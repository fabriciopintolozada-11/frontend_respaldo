export interface StaleQuoteInfo {
  isStaleQuote: boolean;
  daysWaitingApproval: number;
  customerPhone?: string;
}

export const STALE_QUOTE_THRESHOLD_DAYS = 15;

export const STALE_QUOTE_ALERT_LABEL = 'Alerta: 15+ días sin respuesta';

export const ONLY_STALE_QUOTES_FILTER_LABEL = 'Solo estancados (≥15 días)';