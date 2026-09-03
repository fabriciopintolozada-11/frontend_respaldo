import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Lock,
  RefreshCw,
  Wrench,
} from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { useToast } from '../../../shared/components/ToastContext';
import { ApiError } from '../../../shared/api/httpClient';

import { workOrdersService } from '../../work-orders/api/work-orders-service';

import { useAssignedOrders } from '../hooks/useAssignedOrders';
import { useMechanicMutations } from '../hooks/useMechanicMutations';

import { AssignedOrderCard } from '../components/AssignedOrderCard';
import { AdditionalWorkModal } from '../components/AdditionalWorkModal';
import { AwaitingPartModal } from '../components/AwaitingPartModal';

import type { AssignedWorkOrderDetail } from '../api/types';
import type { SetAwaitingPartPayload } from '../api/awaiting-part-api';

export function MechanicConsoleView() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    toggleLabor,
    confirmPart,
    updateStatus,
    setAwaitingPart,
  } = useMechanicMutations();

  const assignedQuery = useAssignedOrders();
  const orders = assignedQuery.data ?? [];

  const [reportingOrder, setReportingOrder] =
    useState<AssignedWorkOrderDetail | null>(null);

  const [awaitingPartOrder, setAwaitingPartOrder] =
    useState<AssignedWorkOrderDetail | null>(null);

  const [additionalDesc, setAdditionalDesc] = useState('');
  const [additionalHours, setAdditionalHours] = useState(2);
  const [additionalPartDesc, setAdditionalPartDesc] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ['mechanic'],
    });
  };

  const handleToggleLabor = async (
    orderId: string,
    taskId: string,
  ) => {
    try {
      await toggleLabor.mutateAsync({ orderId, laborId: taskId });
      toast.success('Estado de tarea actualizado');
    } catch {
      toast.danger('No se pudo actualizar la tarea');
    }
  };

  const handleConfirmPart = async (
    orderId: string,
    partId: string,
  ) => {
    try {
      await confirmPart.mutateAsync({
        orderId,
        partItemId: partId,
      });

      toast.success(
        'Repuesto instalado',
        'El stock del inventario se descontó automáticamente.',
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al registrar el repuesto';
      toast.danger('Fallo del repuesto', msg);
    }
  };

  const handleFinalize = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: 'FINALIZADA',
        changedBy: 'Mecánico autenticado (Trabajo completado)',
      });

      toast.success(
        'Orden finalizada',
        'Orden lista para control de calidad y liquidación.',
      );
    } catch {
      toast.danger('No se pudo finalizar la orden');
    }
  };

  const handleSetAwaitingPart = async (
    orderId: string,
    payload: SetAwaitingPartPayload,
  ) => {
    try {
      await setAwaitingPart.mutateAsync({
        orderId,
        payload,
      });

      toast.success(
        'Order paused',
        'The work order is now waiting for the missing part.',
      );

      setAwaitingPartOrder(null);
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.statusCode === 409 ||
          error.statusCode === 422
        ) {
          toast.danger(
            'Could not pause the order',
            error.message,
          );
          throw error;
        }

        if (
          error.statusCode === 401 ||
          error.statusCode === 403
        ) {
          toast.danger(
            'Action not allowed',
            error.message,
          );
          throw error;
        }
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Could not register the missing part.';

      toast.danger(
        'Could not pause the order',
        message,
      );

      throw error;
    }
  };

  const handleReportAdditional = async () => {
    if (!reportingOrder || !additionalDesc.trim()) {
      toast.warning(
        'Ingrese la descripción del daño o trabajo adicional detectado.',
      );
      return;
    }

    setIsSubmittingReport(true);

    try {
      await workOrdersService.reportAdditionalWork(
        reportingOrder.id,
        additionalDesc,
        750,
        [
          {
            description: `[ADICIONAL] ${additionalDesc}`,
            estimatedHours: Number(additionalHours) || 2,
            hourlyRateBOB: 120,
            totalBOB:
              (Number(additionalHours) || 2) * 120,
            assignedMechanicId: undefined,
          },
        ],
        additionalPartDesc
          ? [
              {
                partId: 'REP-ADD-001',
                partCode: 'REP-ADD',
                description: `[ADICIONAL] ${additionalPartDesc}`,
                quantityRequired: 1,
                unitPriceBOB: 200,
                totalBOB: 200,
              },
            ]
          : [],
      );

      toast.warning(
        'Orden de trabajo suspendida',
        'El jefe de taller y el cliente fueron notificados. La orden queda pausada hasta la aprobación explícita.',
      );

      setReportingOrder(null);
      setAdditionalDesc('');
      setAdditionalPartDesc('');
      refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al reportar el daño';
      toast.danger('Falló el reporte', msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (assignedQuery.isPending) {
    return <LoadingSkeleton rows={4} />;
  }

  if (assignedQuery.isError) {
    return (
      <EmptyState
        icon={<Wrench className="w-8 h-8 text-slate-400" />}
        title="No se pudieron cargar tus órdenes"
        description="Verifica que la sesión corresponda a un mecánico."
        actionLabel="Reintentar"
        onAction={refresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
              <Wrench className="w-5 h-5" />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Consola de Mecánico
            </h1>
          </div>

          <p className="text-xs text-slate-600 mt-1.5">
            Panel táctil para tareas en bahía, diagnóstico, instalación de repuestos y reporte de incidentes.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
          <Lock className="w-3.5 h-3.5 text-lime-700" />
          <span>Vista técnica (sin costos)</span>
        </div>
      </div>

      {/* Sesión autenticada */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Wrench className="w-4 h-4 text-lime-700" />
          <span>Sesión de mecánico autenticada</span>
        </div>
      </div>

      {/* Órdenes asignadas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-500" />
            Órdenes asignadas ({orders.length})
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8 text-slate-400" />}
            title="No hay órdenes asignadas actualmente"
            description="No hay vehículos en espera para tu puesto de trabajo. El jefe de taller asignará la siguiente orden disponible."
          />
        ) : (
          orders.map((order) => (
            <AssignedOrderCard
              key={order.id}
              order={order}
              onToggleLabor={(taskId) =>
                handleToggleLabor(
                  order.id,
                  taskId,
                )
              }
              onConfirmPart={(partId) =>
                handleConfirmPart(
                  order.id,
                  partId,
                )
              }
              onFinalize={() =>
                handleFinalize(order.id)
              }
              onReportAdditional={() =>
                setReportingOrder(order)
              }
              onSetAwaitingPart={() =>
                setAwaitingPartOrder(order)
              }
              isMutating={
                toggleLabor.isPending ||
                confirmPart.isPending ||
                updateStatus.isPending ||
                setAwaitingPart.isPending
              }
            />
          ))
        )}
      </div>

      {/* Modal de trabajo adicional (RN-03) */}
      <AdditionalWorkModal
        isOpen={!!reportingOrder}
        vehiclePlate={reportingOrder?.plate ?? ''}
        description={additionalDesc}
        hours={additionalHours}
        partDescription={additionalPartDesc}
        isSubmitting={isSubmittingReport}
        onDescriptionChange={setAdditionalDesc}
        onHoursChange={setAdditionalHours}
        onPartDescriptionChange={setAdditionalPartDesc}
        onSubmit={handleReportAdditional}
        onClose={() => setReportingOrder(null)}
      />

      <AwaitingPartModal
        isOpen={!!awaitingPartOrder}
        order={awaitingPartOrder}
        onClose={() => setAwaitingPartOrder(null)}
        onSubmit={handleSetAwaitingPart}
        isPending={setAwaitingPart.isPending}
      />
    </div>
  );
}
