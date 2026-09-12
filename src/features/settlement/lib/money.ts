// US-20 / RN-21: the backend serializes every monetary value as a string
// with 2 decimals (BE-13). The frontend only formats these strings for
// display and never sends monetary amounts in the deliver payload (RN-21).
const bobFormatter = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBoB(value: string, currency = 'BOB'): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return `${bobFormatter.format(numeric)} ${currency}`;
}