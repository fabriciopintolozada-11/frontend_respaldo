import React from 'react';
import { WorkOrderStatus } from '../types/openapi';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export interface StatusPipelineProps {
  currentStatus: WorkOrderStatus;
  isSuspendedForAdditionalWork?: boolean;
  daysWithoutClientResponse?: number;
  onSelectNextStatus?: (newStatus: WorkOrderStatus) => void;
  interactive?: boolean;
  className?: string;
}

const STEPS: { status: WorkOrderStatus; label: string; shortLabel: string; stepNumber: number }[] = [
  { status: 'REGISTRADA', label: '1. Registrada', shortLabel: 'Reg.', stepNumber: 1 },
  { status: 'DIAGNOSTICADA', label: '2. Diagnosticada', shortLabel: 'Diag.', stepNumber: 2 },
  { status: 'PRESUPUESTADA', label: '3. Presupuestada', shortLabel: 'Ppto.', stepNumber: 3 },
  { status: 'APROBADA', label: '4. Aprobada x Cliente', shortLabel: 'Aprob.', stepNumber: 4 },
  { status: 'EN_PROGRESO', label: '5. En Progreso', shortLabel: 'Prog.', stepNumber: 5 },
  { status: 'EN_ESPERA_REPUESTO', label: '6. Espera Repuesto', shortLabel: 'Rep.', stepNumber: 6 },
  { status: 'FINALIZADA', label: '7. Finalizada', shortLabel: 'Fin.', stepNumber: 7 },
];

export const StatusPipeline: React.FC<StatusPipelineProps> = ({
  currentStatus,
  isSuspendedForAdditionalWork = false,
  daysWithoutClientResponse = 0,
  onSelectNextStatus,
  interactive = false,
  className = '',
}) => {
  const currentStepIdx = STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className={`w-full ${className}`}>
      {/* Visual Banners if relevant */}
      {isSuspendedForAdditionalWork && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-start gap-2.5 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Regla RN-03 Aplicada:</span> Trabajo en bahía suspendido temporalmente por
            detección de daños adicionales. Requiere autorización explícita del cliente para continuar.
          </div>
        </div>
      )}

      {daysWithoutClientResponse >= 15 && currentStatus === 'PRESUPUESTADA' && (
        <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300 flex items-start gap-2.5 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Alerta RN-06 ({daysWithoutClientResponse} días sin respuesta):</span> La orden
            superó los 15 días tras el envío del presupuesto. Notificar al cliente sobre cargos de custodia y parqueo.
          </div>
        </div>
      )}

      {/* Pipeline Track */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
        <div className="flex items-center min-w-[700px] justify-between relative py-2">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-neutral-200 dark:bg-neutral-800 -z-0" />

          {STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx > idx;
            const isCurrent = step.status === currentStatus;
            const isPending = currentStepIdx < idx;
            const isClickable = interactive && onSelectNextStatus && Math.abs(currentStepIdx - idx) === 1;

            return (
              <div
                key={step.status}
                className="relative z-10 flex flex-col items-center group"
                onClick={() => {
                  if (isClickable && onSelectNextStatus) {
                    onSelectNextStatus(step.status);
                  }
                }}
              >
                {/* Step Node */}
                <button
                  type="button"
                  disabled={!isClickable}
                  aria-label={step.label}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-sm ${
                    isCurrent
                      ? 'bg-amber-600 text-white ring-4 ring-amber-500/20 scale-110'
                      : isCompleted
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400'
                  } ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-amber-400' : 'cursor-default'}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 animate-pulse" />
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </button>

                {/* Step Label */}
                <span
                  className={`mt-2 text-xs text-center font-medium whitespace-nowrap px-1 ${
                    isCurrent
                      ? 'text-amber-700 dark:text-amber-400 font-bold'
                      : isCompleted
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>

                {isCurrent && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mt-0.5">
                    Estado Actual
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
