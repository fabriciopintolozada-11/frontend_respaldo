import { RefreshCw, Wrench } from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { useWorkBaysMonitoring } from '../hooks/useWorkBaysMonitoring';
import { WorkBaysGrid } from '../components/WorkBaysGrid';

export function WorkBaysMonitoringPage() {
  const query = useWorkBaysMonitoring();
  const bays = query.data ?? [];

  const handleRefresh = () => {
    void query.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-lime-200 bg-lime-50 text-lime-700">
              <Wrench className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950">
              Monitoreo de Bahías
            </h1>
          </div>
          <p className="mt-1.5 text-xs text-slate-600">
            Control físico de las 4 bahías del taller · actualización automática cada 30 segundos.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          onClick={handleRefresh}
          disabled={query.isPending}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Refrescar
        </Button>
      </div>

      {query.isPending ? (
        <LoadingSkeleton rows={4} tone="light" />
      ) : query.isError ? (
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : 'No se pudieron cargar las bahías desde el backend de monitoreo.'
          }
          onRetry={handleRefresh}
        />
      ) : (
        <WorkBaysGrid bays={bays} />
      )}
    </div>
  );
}