import { Check, Circle } from 'lucide-react';

import { normalizeWorkOrderStatus, WORK_ORDER_STATUS_LABELS, WORK_ORDER_STATUS_ORDER } from '../work-order-status';

export interface TrackingStatusStepperProps {
  workOrderStatus: string;
}

export function TrackingStatusStepper({ workOrderStatus }: TrackingStatusStepperProps) {
  const normalizedStatus = normalizeWorkOrderStatus(workOrderStatus);
  const currentIndex = normalizedStatus ? WORK_ORDER_STATUS_ORDER.indexOf(normalizedStatus) : -1;

  return (
    <ol className="flex flex-col gap-0 md:flex-row md:gap-2" aria-label="Etapas de la orden de trabajo">
      {WORK_ORDER_STATUS_ORDER.map((status, index) => {
        const isComplete = currentIndex >= 0 && index < currentIndex;
        const isCurrent = index === currentIndex;
        const isReached = isComplete || isCurrent;

        return (
          <li key={status} className="relative flex min-h-14 flex-1 items-center gap-3 md:min-h-0 md:flex-col md:items-stretch md:gap-3" aria-current={isCurrent ? 'step' : undefined}>
            {index < WORK_ORDER_STATUS_ORDER.length - 1 && (
              <span className={`absolute left-[11px] top-7 h-full w-px md:left-[50%] md:top-[11px] md:h-px md:w-full ${index < currentIndex ? 'bg-lime-400' : 'bg-slate-200'}`} aria-hidden="true" />
            )}
            <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white ${isReached ? 'border-lime-400 bg-lime-400 text-lime-950' : 'border-slate-300 text-slate-400'} ${isCurrent ? 'ring-4 ring-lime-100' : ''}`} aria-hidden="true">
              {isComplete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
            </span>
            <span className={`relative z-10 text-sm md:text-center md:text-xs ${isCurrent ? 'font-bold text-slate-950' : isReached ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
              {WORK_ORDER_STATUS_LABELS[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
