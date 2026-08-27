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
import { useToast } from '../../../shared/components/ToastContext';
import { workOrdersService } from '../../work-orders/api/work-orders-service';
import { useAssignedOrders } from '../hooks/useAssignedOrders';
import { useMechanicMutations } from '../hooks/useMechanicMutations';
import { AssignedOrderCard } from '../components/AssignedOrderCard';
import { AdditionalWorkModal } from '../components/AdditionalWorkModal';
import type { AssignedWorkOrderDetail } from '../api/types';

export function MechanicConsoleView() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { toggleLabor, confirmPart, updateStatus } = useMechanicMutations();

  const assignedQuery = useAssignedOrders();
  const orders = assignedQuery.data ?? [];

  const [reportingOrder, setReportingOrder] =
    useState<AssignedWorkOrderDetail | null>(null);
  const [additionalDesc, setAdditionalDesc] = useState('');
  const [additionalHours, setAdditionalHours] = useState(2);
  const [additionalPartDesc, setAdditionalPartDesc] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanic'] });
  };

  const handleToggleLabor = async (orderId: string, taskId: string) => {
    try {
      await toggleLabor.mutateAsync({ orderId, laborId: taskId });
      toast.success('Task status updated');
    } catch {
      toast.danger('Could not update task');
    }
  };

  const handleConfirmPart = async (orderId: string, partId: string) => {
    try {
      await confirmPart.mutateAsync({ orderId, partItemId: partId });
      toast.success(
        'Part Installed',
        'Inventory stock automatically deducted.',
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error registering part';
      toast.danger('Part Failed', msg);
    }
  };

  const handleFinalize = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: 'FINALIZADA',
        changedBy: 'Authenticated Mechanic (Work completed)',
      });
      toast.success(
        'Order Finalized',
        'Order ready for quality control and settlement.',
      );
    } catch {
      toast.danger('Could not finalize the order');
    }
  };

  const handleReportAdditional = async () => {
    if (!reportingOrder || !additionalDesc.trim()) {
      toast.warning(
        'Enter the description of the additional damage or work detected.',
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
            description: `[ADDITIONAL] ${additionalDesc}`,
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
                description: `[ADDITIONAL] ${additionalPartDesc}`,
                quantityRequired: 1,
                unitPriceBOB: 200,
                totalBOB: 200,
              },
            ]
          : [],
      );

      toast.warning(
        'Work Order Suspended',
        'Workshop lead and client notified. Order paused until explicit confirmation.',
      );
      setReportingOrder(null);
      setAdditionalDesc('');
      setAdditionalPartDesc('');
      refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error reporting damage';
      toast.danger('Report failed', msg);
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
        title="Could not load your orders"
        description="Verify that the session corresponds to a mechanic."
        actionLabel="Retry"
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
              Mechanic Console
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Touch panel for bay tasks, diagnostic, part installation and
            incident reporting.
          </p>
        </div>

        {/* RN-16 Privacy Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
          <Lock className="w-3.5 h-3.5 text-lime-700" />
          <span>Technical view (no costs)</span>
        </div>
      </div>

      {/* Authenticated Session */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Wrench className="w-4 h-4 text-lime-700" />
          <span>Authenticated mechanic session</span>
        </div>
      </div>

      {/* Assigned Orders Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-500" />
            Assigned Orders ({orders.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8 text-slate-400" />}
            title="No assigned orders currently"
            description="No vehicles in queue for your workstation. The Workshop Lead will assign the next available order."
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
              onFinalize={() => handleFinalize(order.id)}
              onReportAdditional={() => setReportingOrder(order)}
              isMutating={
                toggleLabor.isPending ||
                confirmPart.isPending ||
                updateStatus.isPending
              }
            />
          ))
        )}
      </div>

      {/* Additional Work Modal (RN-03) */}
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
    </div>
  );
}
