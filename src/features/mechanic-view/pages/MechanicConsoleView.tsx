import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Lock,
  RefreshCw,
  Wrench,
} from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/ToastContext';
import { workOrdersService } from '../../work-orders/api/work-orders-service';
import {
  translateConsumePartError,
  useConsumeSparePart,
} from '../../work-orders/api/useConsumeSparePart';
import { useAssignedOrders } from '../hooks/useAssignedOrders';
import { useMechanicMutations } from '../hooks/useMechanicMutations';
import { AssignedOrderCard } from '../components/AssignedOrderCard';
import { AdditionalWorkModal } from '../components/AdditionalWorkModal';
import type { AssignedWorkOrderDetail } from '../api/types';

export function MechanicConsoleView() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { toggleLabor, updateStatus } = useMechanicMutations();
  const consumePart = useConsumeSparePart();

  const assignedQuery = useAssignedOrders();
  const orders = assignedQuery.data ?? [];

  const [reportingOrder, setReportingOrder] =
    useState<AssignedWorkOrderDetail | null>(null);
  const [diagnosingOrder, setDiagnosingOrder] =
    useState<DiagnosticWorkOrderContext | null>(null);
  const [isSubmittingDiagnostic, setIsSubmittingDiagnostic] = useState(false);
  const [additionalDesc, setAdditionalDesc] = useState('');
  const [additionalHours, setAdditionalHours] = useState(2);
  const [additionalPartDesc, setAdditionalPartDesc] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanic'] });
  };

  const openDiagnosticForm = (order: AssignedWorkOrderDetail) => {
    setDiagnosingOrder({
      id: order.id,
      code: `OT-${order.id.slice(0, 8).toUpperCase()}`,
      plate: order.plate,
      status: order.status,
      initialComplaint: order.initialComplaint,
      vehicleDescription: [order.vehicle?.brand ?? '', order.vehicle?.model ?? ''].filter(Boolean).join(' ') || undefined,
    });
  };

  const handleSubmitDiagnostic = async (payload: DiagnosticPayload) => {
    if (!diagnosingOrder) return;
    setIsSubmittingDiagnostic(true);
    try {
      await workOrdersService.createDiagnostic(diagnosingOrder.id, payload);
      toast.success(
        'Diagnóstico registrado',
        'La OT fue actualizada al estado correspondiente.',
      );
      setDiagnosingOrder(null);
      refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo registrar el diagnóstico';
      toast.danger('Fallo del diagnóstico', msg);
      throw err;
    } finally {
      setIsSubmittingDiagnostic(false);
    }
  };

  const handleToggleLabor = async (orderId: string, taskId: string) => {
    try {
      await toggleLabor.mutateAsync({ orderId, laborId: taskId });
      toast.success('Estado de tarea actualizado');
    } catch {
      toast.danger('No se pudo actualizar la tarea');
    }
  };

  const handleConfirmPart = async (orderId: string, partId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const part = order?.parts.find((p) => p.id === partId);

    // HU-07: the endpoint requires the approved quote part id (quotePartId).
    if (!part || !part.quotePartId) {
      toast.danger(
        'Fallo del repuesto',
        'El id del repuesto (quotePartId) no está disponible. No se puede confirmar la instalación.',
      );
      return;
    }

    try {
      await consumePart.mutateAsync({
        workOrderId: orderId,
        quotePartId: part.quotePartId,
        quantity: part.quantityRequired,
      });
      toast.success(
        'Repuesto instalado',
        'El stock del inventario se descontó automáticamente.',
      );
    } catch (err) {
      const details = translateConsumePartError(err);
      toast.danger('Fallo del repuesto', details.message);
    }
  };

  const handleFinalize = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: 'FINALIZADO',
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
            totalBOB: (Number(additionalHours) || 2) * 120,
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
      {/* Header */}
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

        {/* RN-16 Privacy Notice */}
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
                handleToggleLabor(order.id, taskId)
              }
              onConfirmPart={(partId) =>
                handleConfirmPart(order.id, partId)
              }
              onDiagnose={() => openDiagnosticForm(order)}
              onFinalize={() => handleFinalize(order.id)}
              onReportAdditional={() => setReportingOrder(order)}
              isMutating={
                toggleLabor.isPending ||
                consumePart.isPending ||
                updateStatus.isPending
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

      {/* Modal de diagnóstico técnico (US-11) */}
      <Modal
        isOpen={Boolean(diagnosingOrder)}
        onClose={() => setDiagnosingOrder(null)}
        title="Registrar diagnóstico técnico"
        subtitle="Documenta los hallazgos y las necesidades preliminares de la orden."
        maxWidth="2xl"
        variant="light"
      >
        {diagnosingOrder && (
          <DiagnosticForm
            order={diagnosingOrder}
            parts={[]}
            onCancel={() => setDiagnosingOrder(null)}
            onSubmit={handleSubmitDiagnostic}
          />
        )}
      </Modal>
    </div>
  );
}
