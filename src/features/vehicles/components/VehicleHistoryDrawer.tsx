import { AlertCircle, CalendarDays, CarFront, CheckCircle2, Clock3, Package, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { ApiError } from '../../../shared/api/httpClient';
import type { components } from '../../../shared/api/schema.gen';
import { useVehicleHistory } from '../hooks/useVehicleHistory';

interface VehicleHistoryDrawerProps {
  plate: string | null;
  onClose: () => void;
}

export function VehicleHistoryDrawer({ plate, onClose }: VehicleHistoryDrawerProps) {
  const query = useVehicleHistory(plate ?? '', Boolean(plate));

  if (!plate) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button type="button" className="absolute inset-0 cursor-default bg-slate-950/40" aria-label="Cerrar expediente" onClick={onClose} />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-8" aria-label={`Expediente histórico ${plate}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">Expediente histórico</p>
            <h2 className="mt-1 font-mono text-2xl font-extrabold text-slate-900">{plate}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100" aria-label="Cerrar expediente">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {query.isPending && <HistoryLoading />}
        {query.isError && <HistoryError error={query.error} onRetry={() => void query.refetch()} />}
        {query.data && <HistoryContent data={query.data} />}
      </aside>
    </div>
  );
}

function HistoryLoading() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-lime-400 border-t-transparent" />
      <p className="font-semibold text-slate-700">Consultando expediente...</p>
    </div>
  );
}

function HistoryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isNotFound = error instanceof ApiError && error.isNotFound;
  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
      <AlertCircle className="h-6 w-6" aria-hidden="true" />
      <h3 className="mt-3 font-bold">{isNotFound ? 'Vehículo no encontrado' : 'No se pudo cargar el expediente'}</h3>
      <p className="mt-1 text-sm">{isNotFound ? 'La placa no tiene un vehículo registrado en el taller.' : getErrorMessage(error)}</p>
      {!isNotFound && <button type="button" onClick={onRetry} className="mt-4 min-h-[44px] rounded-xl bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800">Reintentar</button>}
    </div>
  );
}

function HistoryContent({ data }: { data: components['schemas']['VehicleHistoryResponseDto'] }) {
  return (
    <div className="space-y-7 pt-6">
      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
        <SummaryItem icon={<CarFront className="h-4 w-4" />} label="Vehículo" value={`${data.brand} ${data.model} · ${data.year}`} />
        <SummaryItem icon={<CheckCircle2 className="h-4 w-4" />} label="Cliente" value={data.customer.name} />
        <SummaryItem icon={<CalendarDays className="h-4 w-4" />} label="Identificación" value={data.customer.identification} />
        <SummaryItem icon={<Clock3 className="h-4 w-4" />} label="Visitas concluidas" value={String(data.workOrders.length)} />
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold text-slate-900">Visitas anteriores</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{data.workOrders.length}</span>
        </div>
        {data.workOrders.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">El vehículo no registra servicios o reparaciones previas en el taller.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {data.workOrders.map((workOrder) => (
              <article key={workOrder.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">OT {workOrder.id}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{workOrder.status}</span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" />{formatDate(workOrder.createdAt)}</p>
                {workOrder.diagnostic && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Diagnóstico</p>
                    <p className="mt-1 text-sm text-slate-800">{workOrder.diagnostic.description}</p>
                    <p className="mt-2 text-xs text-slate-500">Horas estimadas: {workOrder.diagnostic.estimatedHours}</p>
                  </div>
                )}
                <div className="mt-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><Package className="h-4 w-4" />Repuestos instalados</p>
                  {workOrder.consumedParts.length === 0 ? <p className="mt-2 text-sm text-slate-500">No hay repuestos registrados.</p> : (
                    <ul className="mt-2 space-y-2">
                      {workOrder.consumedParts.map((part) => <li key={part.sparePartId} className="flex justify-between gap-3 text-sm text-slate-700"><span>{part.code} · {part.name}</span><span className="font-bold">x{part.quantity}</span></li>)}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-extrabold text-slate-900">Trazabilidad técnica</h3>
        {data.technicalHistory.length === 0 ? <p className="mt-4 text-sm text-slate-500">No hay registros técnicos adicionales.</p> : (
          <ol className="mt-4 space-y-3 border-l-2 border-lime-200 pl-5">
            {data.technicalHistory.map((entry) => <li key={entry.id} className="relative text-sm text-slate-700"><span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-lime-400 ring-4 ring-white" />{entry.description}<time className="mt-1 block text-xs text-slate-400">{formatDate(entry.createdAt)}</time></li>)}
          </ol>
        )}
      </section>
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">{icon}{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) return 'Tu sesión no es válida. Inicia sesión nuevamente.';
    if (error.statusCode === 403) return 'Tu rol no tiene permisos para consultar este expediente.';
    if (error.statusCode >= 500) return 'El servidor no pudo completar la consulta. Intenta nuevamente.';
    return error.message;
  }
  return error instanceof Error && error.message ? error.message : 'Ocurrió un error inesperado.';
}
