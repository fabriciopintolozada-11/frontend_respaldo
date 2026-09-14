import { ClipboardList, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';

import { useReadyToDeliverOrders } from '../api/use-settlement';
import { translateSettlementLoadError } from '../api/settlement.errors';

import { WorkOrderTrackingCard } from '../../work-orders/components/WorkOrderTrackingCard';

// US-20: settlement index. Lists the work orders in LISTO_ENTREGA for
// RECEPTIONIST / WORKSHOP_LEAD / ADMIN so they can open a settlement.
export function SettlementIndexPage() {
  const navigate = useNavigate();
  const readyQuery = useReadyToDeliverOrders();

  if (readyQuery.isPending) {
    return <LoadingSkeleton rows={4} tone="light" />;
  }

  if (readyQuery.isError) {
    const details = translateSettlementLoadError(readyQuery.error);
    return <ErrorState message={details.message} onRetry={() => void readyQuery.refetch()} />;
  }

  const orders = readyQuery.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-600">
            Liquidación de cuentas
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Unidades listas para entrega
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Selecciona una orden con la reparación concluida para liquidar los
            costos, aplicar descuentos (jefe de taller) y registrar la entrega
            del vehículo.
          </p>
        </div>
        <div className="hidden rounded-2xl border border-lime-200 bg-lime-50 p-4 lg:block">
          <DollarSign className="h-8 w-8 text-lime-700" aria-hidden="true" />
        </div>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          tone="light"
          icon={<ClipboardList className="h-7 w-7" />}
          title="No hay órdenes listas para entregar"
          description="Cuando una reparación sea concluida por el mecánico, la orden aparecerá aquí para su liquidación."
          actionLabel="Ir a seguimiento"
          onAction={() => navigate('/seguimiento')}
        />
      ) : (
        <section className="space-y-4" aria-live="polite">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-700">
              Resultado
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              {orders.length} {orders.length === 1 ? 'orden lista' : 'órdenes listas'}
            </h2>
          </div>
          {orders.map((order) => (
            <WorkOrderTrackingCard
              key={order.id}
              order={order}
              onViewHistory={() => navigate('/seguimiento')}
              onSettle={(orderId) => navigate(`/liquidacion/${orderId}`)}
            />
          ))}
        </section>
      )}

      <div className="flex justify-center">
        <Button
          variant="outline-light"
          onClick={() => navigate('/seguimiento')}
        >
          Ver todas por placa
        </Button>
      </div>
    </div>
  );
}