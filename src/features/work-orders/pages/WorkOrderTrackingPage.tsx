import { AlertCircle, ClipboardList, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { ApiError } from '../../../shared/api/httpClient';
import { normalizeTrackingPlate } from '../api/tracking-api';
import { WorkOrderTrackingCard } from '../components/WorkOrderTrackingCard';
import { useWorkOrderTracking } from '../hooks/useWorkOrderTracking';
import { VehicleHistoryDrawer } from '../../vehicles/components/VehicleHistoryDrawer';
import { useAuth } from '../../auth/hooks/useAuth';
import { useToast } from '../../../shared/components/ToastContext';
import { useCompleteWorkOrder } from '../../mechanic-view/hooks/useCompleteWorkOrder';
import { translateCompleteError } from '../../mechanic-view/api/complete-work-order.error';
import type { CompleteWorkOrderPayload } from '../../mechanic-view/api/complete-work-order.types';
import type {
  CompleteRepairOrderContext,
} from '../../mechanic-view/components/CompleteRepairModal';
import { CompleteRepairModal } from '../../mechanic-view/components/CompleteRepairModal';

const PLATE_PATTERN = /^[A-Z0-9-]{3,10}$/;

export function WorkOrderTrackingPage() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const completeWorkOrder = useCompleteWorkOrder();

  const [plate, setPlate] = useState('');
  const [searchedPlate, setSearchedPlate] = useState('');
  const [historyPlate, setHistoryPlate] = useState<string | null>(null);
  const [completingOrder, setCompletingOrder] =
    useState<CompleteRepairOrderContext | null>(null);

  // US-19 / FE-18: only the WORKSHOP_LEAD may conclude a repair from the
  // tracking board (RN-04); receptionist and admin only read.
  const canComplete = user?.role === 'WORKSHOP_LEAD';

  // US-20 / FE-18: reception, workshop lead and admin may open a settlement
  // for an order ready for delivery (RN-15 / RN-16).
  const canSettle =
    user?.role === 'RECEPTIONIST' ||
    user?.role === 'WORKSHOP_LEAD' ||
    user?.role === 'ADMIN';

  const normalizedPlate = normalizeTrackingPlate(plate);
  const isValidPlate = PLATE_PATTERN.test(normalizedPlate);
  const query = useWorkOrderTracking(searchedPlate);

  useEffect(() => {
    if (!isValidPlate) {
      setSearchedPlate('');
      return;
    }
    const timeout = window.setTimeout(() => setSearchedPlate(normalizedPlate), 300);
    return () => window.clearTimeout(timeout);
  }, [isValidPlate, normalizedPlate]);

  const handleOpenComplete = (orderId: string) => {
    setCompletingOrder({ id: orderId, plate: searchedPlate });
  };

  const handleComplete = async (
    orderId: string,
    payload: CompleteWorkOrderPayload,
  ) => {
    try {
      await completeWorkOrder.mutateAsync({ workOrderId: orderId, ...payload });
      toast.success(
        'Reparación concluida',
        'La OT está lista para entrega y la bahía quedó disponible.',
      );
      setCompletingOrder(null);
    } catch (err) {
      const details = translateCompleteError(err);
      toast.danger('No se pudo concluir la reparación', details.message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Seguimiento operativo</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Consulta por placa</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Consulta el estado actual de la orden sin interrumpir a los mecánicos y revisa el expediente técnico permanente del vehículo.</p>
        </div>
        <div className="hidden rounded-2xl border border-lime-200 bg-lime-50 p-4 lg:block"><ClipboardList className="h-8 w-8 text-lime-700" aria-hidden="true" /></div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="tracking-plate" className="block text-sm font-bold text-slate-800">Placa del vehículo</label>
        <div className="relative mt-2 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="tracking-plate" value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="ABC123" autoComplete="off" className="min-h-[52px] w-full rounded-xl border border-slate-300 pl-12 pr-4 font-mono text-lg uppercase tracking-widest outline-none transition focus:border-lime-500 focus:ring-4 focus:ring-lime-100" />
        </div>
        <p className="mt-2 text-xs text-slate-500">La búsqueda se ejecuta automáticamente al ingresar una placa válida.</p>
        {plate.length > 0 && !isValidPlate && <p className="mt-2 text-sm font-semibold text-red-600" role="alert">Ingresa una placa válida de 3 a 10 caracteres.</p>}
      </section>

      <TrackingResults
        query={query}
        searchedPlate={searchedPlate}
        onViewHistory={setHistoryPlate}
        onComplete={canComplete ? handleOpenComplete : undefined}
        onSettle={canSettle ? (orderId) => navigate(`/liquidacion/${orderId}`) : undefined}
      />

      {searchedPlate && !query.isPending && !query.isError && query.data?.length === 0 && (
        <button type="button" onClick={() => setHistoryPlate(searchedPlate)} className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-lime-500 hover:bg-lime-50">Consultar expediente histórico de {searchedPlate}</button>
      )}

      <VehicleHistoryDrawer plate={historyPlate} onClose={() => setHistoryPlate(null)} />

      <CompleteRepairModal
        isOpen={Boolean(completingOrder)}
        order={completingOrder}
        onClose={() => setCompletingOrder(null)}
        onSubmit={handleComplete}
        isPending={completeWorkOrder.isPending}
      />
    </div>
  );
}

function TrackingResults({ query, searchedPlate, onViewHistory, onComplete, onSettle }: { query: ReturnType<typeof useWorkOrderTracking>; searchedPlate: string; onViewHistory: (plate: string) => void; onComplete?: (orderId: string) => void; onSettle?: (orderId: string) => void }) {
  if (!searchedPlate) return <EmptyTrackingState title="Esperando una placa" message="La orden activa y sus datos de permanencia aparecerán aquí." />;
  if (query.isPending) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center" role="status"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-lime-400 border-t-transparent" /><p className="mt-3 font-semibold text-slate-700">Consultando seguimiento...</p></div>;
  if (query.isError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert"><AlertCircle className="h-6 w-6" aria-hidden="true" /><p className="mt-2 font-bold">No se pudo consultar el seguimiento</p><p className="mt-1 text-sm">{getErrorMessage(query.error)}</p><button type="button" onClick={() => void query.refetch()} className="mt-4 min-h-[44px] rounded-xl bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800">Reintentar</button></div>;
  if (!query.data?.length) return <EmptyTrackingState title="Sin órdenes activas" message={`No hay órdenes de trabajo activas asociadas a ${searchedPlate}.`} />;

  return <section className="space-y-4" aria-live="polite"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">Resultado de seguimiento</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">{query.data.length} {query.data.length === 1 ? 'orden encontrada' : 'órdenes encontradas'}</h2></div>{query.data.map((order) => <WorkOrderTrackingCard key={order.id} order={order} onViewHistory={onViewHistory} onComplete={onComplete} onSettle={onSettle} />)}</section>;
}

function EmptyTrackingState({ title, message }: { title: string; message: string }) {
  return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><ClipboardList className="mx-auto h-9 w-9 text-slate-300" aria-hidden="true" /><h2 className="mt-3 font-bold text-slate-800">{title}</h2><p className="mt-1 text-sm text-slate-500">{message}</p></section>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) return 'Tu sesión no es válida. Inicia sesión nuevamente.';
    if (error.statusCode === 403) return 'Tu rol no tiene permisos para consultar el seguimiento.';
    return error.message;
  }
  return error instanceof Error && error.message ? error.message : 'Ocurrió un error inesperado.';
}
