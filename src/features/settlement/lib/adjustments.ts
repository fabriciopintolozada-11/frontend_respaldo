import type { SettlementAdjustmentSummary } from '../api/settlement.types';

// RN-15: a DISCOUNT is still active (voidable) if it has not been completely
// counteracted by VOID records. The backend does not link a VOID to the
// DISCOUNT it reverses: voids simply subtract their amount from the global
// totals. To decide which discounts are still active, VOID coverage is
// consumed greedily starting from the first DISCOUNT (FIFO). This is exact
// for the common single-discount / single-void scenario; on ambiguous multi
// cases the backend still rejects double voids with a 409 (RN-15).
export function isDiscountActive(
  adjustments: SettlementAdjustmentSummary[],
  index: number,
): boolean {
  const entry = adjustments[index];
  if (!entry || entry.type !== 'DISCOUNT') return false;

  const voidTotal = adjustments.reduce(
    (sum, current) => (current.type === 'VOID' ? sum + Number(current.amount) : sum),
    0,
  );

  const previousDiscounts = adjustments
    .slice(0, index)
    .reduce(
      (sum, current) => (current.type === 'DISCOUNT' ? sum + Number(current.amount) : sum),
      0,
    );

  const target = Number(entry.amount);
  const remainingCoverage = Math.max(0, voidTotal - previousDiscounts);
  const absorbed = Math.min(target, remainingCoverage);

  // epsilon guards against float drift of money amounts.
  return target - absorbed > 0.004;
}