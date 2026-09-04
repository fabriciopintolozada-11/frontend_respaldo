import { AlertCircle, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react';
import { useState } from 'react';

import { ApiError } from '../../../shared/api/httpClient';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { usePublicTracking } from '../api/usePublicTracking';
import { TrackingForm } from '../components/TrackingForm';
import { TrackingStatusStepper } from '../components/TrackingStatusStepper';
import type { TrackingStatusFormValues } from '../tracking-status-schema';
import { normalizeWorkOrderStatus, WORK_ORDER_STATUS_LABELS } from '../work-order-status';

interface TrackingLookup {
  plate: string;
  identification: string;
}

export function PublicTrackingPage() {
  const [lookup, setLookup] = useState<TrackingLookup | null>(null);
  const query = usePublicTracking({
    plate: lookup?.plate ?? '',
    identification: lookup?.identification ?? '',
    enabled: lookup !== null,
  });

  const handleSubmit = ({ plate, identification }: TrackingStatusFormValues) => {
    setLookup({ plate: plate.trim().toUpperCase(), identification: identification.trim() });
  };

  const isNotFound = query.error instanceof ApiError && query.error.statusCode === 404;
  const normalizedStatus = query.data ? normalizeWorkOrderStatus(query.data.status) : null;
  const currentStage = query.data?.stage ?? (normalizedStatus ? WORK_ORDER_STATUS_LABELS[normalizedStatus] : undefined);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-lime-950">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.18em] text-slate-950">LOS FRATELLI</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">TALLER ANDINO</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
            <ShieldCheck className="h-4 w-4 text-lime-600" />
            Consulta pública segura
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-lime-700">Portal de seguimiento</p>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Consulta el estado de tu vehículo</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Revisa el avance de tu orden de trabajo en tiempo real con los datos que registraste en el taller.
          </p>
          <div className="mt-9 flex justify-center">
            <TrackingForm disabled={query.isFetching} onSubmit={handleSubmit} />
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl" aria-live="polite">
          {lookup === null && (
            <Card variant="public" padding="lg" className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-lime-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-950">Tu información, siempre protegida</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                La consulta muestra únicamente el progreso de la orden. No se publican importes ni información de pago.
              </p>
            </Card>
          )}

          {lookup !== null && query.isPending && (
            <Card variant="public" padding="lg">
              <LoadingSpinner message="Cargando el estado de tu vehículo..." />
            </Card>
          )}

          {lookup !== null && isNotFound && (
            <Card variant="public" padding="lg" className="border-amber-200 bg-amber-50" role="status">
              <div className="flex gap-4">
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
                <div>
                  <h2 className="font-bold text-amber-950">No encontramos una orden de trabajo vigente</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-900">Verifica que la placa y el documento correspondan al titular del vehículo e inténtalo nuevamente.</p>
                </div>
              </div>
            </Card>
          )}

          {lookup !== null && query.isError && !isNotFound && (
            <Card variant="public" padding="lg" className="border-red-200 bg-red-50" role="alert">
              <div className="flex gap-4">
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                <div className="flex-1">
                  <h2 className="font-bold text-red-950">No se pudo completar la consulta</h2>
                  <p className="mt-2 text-sm leading-6 text-red-900">Inténtalo nuevamente en unos segundos.</p>
                  <Button type="button" variant="outline" size="md" className="mt-4 border-red-300 bg-white text-red-800" onClick={() => void query.refetch()}>Reintentar</Button>
                </div>
              </div>
            </Card>
          )}

          {query.isSuccess && query.data && (
            <Card variant="public" padding="lg" className="space-y-8">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
<div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Orden de trabajo</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Vehículo <span className="font-mono text-lime-700">{query.data.plate}</span></h2>
                  <p className="mt-1 text-sm text-slate-600">{query.data.vehicle.brand} {query.data.vehicle.model} · {query.data.vehicle.year}</p>
                </div>
                <div className="rounded-full bg-lime-100 px-4 py-2 text-sm font-bold text-lime-900">{currentStage}</div>
              </div>

              {query.data.readyForPickup && (
                <div className="flex items-start gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4 text-sm text-lime-950" role="status">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-lime-600" />
                  <p><strong>Tu vehículo está listo para ser retirado.</strong> Acércate al taller con tu documento de identidad.</p>
                </div>
              )}

              <div>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Progreso de atención</p>
                    <h3 className="sr-only">Etapa actual de atención</h3>
                    <p className="mt-1 text-sm text-slate-600">Estado actualizado automáticamente.</p>
                  </div>
                  <span className="hidden text-xs font-medium text-slate-400 sm:inline">7 etapas</span>
                </div>
                <TrackingStatusStepper workOrderStatus={query.data.status} />
              </div>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
