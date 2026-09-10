export function buildOnlyStaleQuotesQueryString(onlyStaleQuotes: boolean | undefined): string {
  if (onlyStaleQuotes === undefined) return '';
  return `onlyStaleQuotes=${onlyStaleQuotes ? 'true' : 'false'}`;
}