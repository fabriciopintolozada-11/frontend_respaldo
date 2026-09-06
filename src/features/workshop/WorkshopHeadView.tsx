import { useState } from 'react';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  RefreshCw,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';

import { ApiError } from '../../shared/api/httpClient';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { WorkOrderStatusBadge } from '../../shared/components/Badge';
import { Modal } from '../../shared/components/Modal';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/components/ToastContext';
import type { WorkOrderStatus } from '../../types/workshop';
import type { MechanicWithName, WorkOrderListItem } from './api/types';
import { useActiveMechanics, useAssignOrder, usePendingAssignments } from './hooks/useAssignment';

function formatMechanicId(mechanicId: string): string {
  if (mechanicId.length <= 12) return mechanicId;
  return `${mechanicId.slice(0, 8)}…${mechanicId.slice(-4)}`;
}

function formatMechanicName(mechanic: MechanicWithName): string {
  return mechanic.name && mechanic.name.trim() ? mechanic.name : `Mecánico ${formatMechanicId(mechanic.id)}`;
}

function formatMechanicOption(mechanic: MechanicWithName): string {
  return `${formatMechanicName(mechanic)}${mechanic.isActive ? ' (Activo)' : ''}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// HU-04 / RN-14: maps known backend errors to the lead assignment flow.
function getAssignmentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 403:
        return 'Solo el Jefe de Taller puede asignar órdenes de trabajo (RN-14).';
      case 404:
        return 'La orden de trabajo o el mecánico ya no existen en el sistema.';
      case 422:
        return 'La orden ya no es asignable o el mecánico no está activo (RN-14).';
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export function WorkshopHeadView() {
  const toast = useToast();
  const pendingQuery = usePendingAssignments();
  const mechanicsQuery = useActiveMechanics();
  const assignMutation = useAssignOrder();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  const orders = pendingQuery.data?.data ?? [];
  const mechanics = mechanicsQuery.data ?? [];

  const isLoading = pendingQuery.isLoading || mechanicsQuery.isLoading;
  const isError = pendingQuery.isError || mechanicsQuery.isError;
  const listError =
    pendingQuery.error instanceof Error
      ? pendingQuery.error.message
      : mechanicsQuery.error instanceof Error
        ? mechanicsQuery.error.message
        : 'No se pudieron cargar las órdenes y los mecánicos.';

  const handleRefresh = () => {
    void pendingQuery.refetch();
    void mechanicsQuery.refetch();
  };

  const handleOpenAssignModal = (order?: WorkOrderListItem) => {
    setSelectedOrderId(order?.id ?? orders[0]?.id ?? '');
    setSelectedMechanicId(mechanics[0]?.id ?? '');
    setIsModalOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedOrderId) {
      toast.warning('Datos incompletos', 'Selecciona la orden de trabajo a asignar.');
      return;
    }
    if (!selectedMechanicId) {
      toast.warning('Datos incompletos', 'Selecciona un mecánico activo.');
      return;
    }

    assignMutation.mutate(
      { orderId: selectedOrderId, mechanicId: selectedMechanicId },
      {
        onSuccess: (result) => {
          const assigned = orders.find((order) => order.id === result.id);
          const mechanic = mechanics.find((candidate) => candidate.id === result.mechanicId);
          toast.success(
            'OT Asignada',
            `Orden ${assigned?.plate ?? 'seleccionada'} asignada a ${mechanic ? formatMechanicName(mechanic) : formatMechanicId(result.mechanicId)}.`,
          );
          setIsModalOpen(false);
        },
        onError: (error) => {
          toast.danger(
            'No se pudo asignar la OT',
            getAssignmentErrorMessage(error, 'Error inesperado al asignar la orden.'),
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Panel del Jefe de Taller
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Asignación de órdenes de trabajo recibidas a mecánicos activos (HU-04 / RN-14).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          onClick={handleRefresh}
          disabled={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Actualizar Tablero
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} tone="light" />
      ) : isError ? (
        <ErrorState message={listError} onRetry={handleRefresh} />
      ) : (
        <>
          <Card variant="public" padding="md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-lime-700" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Órdenes recibidas pendientes de asignación
                </h2>
              </div>
              <span className="text-xs text-slate-600 font-mono">{orders.length} pendientes</span>
            </div>

            {orders.length === 0 ? (
              <EmptyState
                tone="light"
                descriptionClassName="text-slate-700"
                icon={<Wrench className="w-8 h-8 text-lime-700" />}
                title="Sin órdenes pendientes de asignación"
                description="No hay órdenes recibidas sin mecánico asignado. Toda la cola está atendida."
              />
            ) : (
              <div className="space-y-2.5">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-base text-slate-950">
                          {order.plate}
                        </span>
                        <WorkOrderStatusBadge status={order.status as WorkOrderStatus} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {order.vehicleBrand} {order.vehicleModel} · {order.vehicleYear} · Cliente:{' '}
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {order.initialComplaint}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        Registrada el {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      leftIcon={<UserPlus className="w-4 h-4" />}
                      onClick={() => handleOpenAssignModal(order)}
                    >
                      Asignar OT
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card variant="public" padding="md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-lime-700" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Mecánicos activos
                </h2>
              </div>
              <span className="text-xs text-slate-600 font-mono">{mechanics.length} activos</span>
            </div>

            {mechanics.length === 0 ? (
              <EmptyState
                tone="light"
                descriptionClassName="text-slate-700"
                icon={<Wrench className="w-8 h-8 text-lime-700" />}
                title="Sin mecánicos activos"
                description="No hay mecánicos activos disponibles para asignar órdenes."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mechanics.map((mechanic) => (
                  <div
                    key={mechanic.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-950">
                        {formatMechanicName(mechanic)}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-mono">{mechanic.id}</p>
                    </div>
                    <span className="text-xs font-bold text-lime-700 shrink-0">
                      {mechanic.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <Modal
        variant="light"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Asignar Orden de Trabajo"
        subtitle="Asigna la OT recibida a un mecánico activo (HU-04 / RN-14)."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="assignment-order-select"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Orden de Trabajo <span className="text-red-600">*</span>
            </label>
            <select
              id="assignment-order-select"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3.5 py-2.5 text-sm font-semibold min-h-[44px] focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
            >
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.plate} - {order.vehicleBrand} {order.vehicleModel} ({order.customerName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="assignment-mechanic-select"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Mecánico Activo <span className="text-red-600">*</span>
            </label>
            <select
              id="assignment-mechanic-select"
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3.5 py-2.5 text-sm font-semibold min-h-[44px] focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
            >
              {mechanics.map((mechanic) => (
                <option key={mechanic.id} value={mechanic.id}>
                  {formatMechanicOption(mechanic)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
            <Button
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              isLoading={assignMutation.isPending}
              disabled={orders.length === 0 || mechanics.length === 0}
              onClick={handleConfirmAssignment}
            >
              Confirmar Asignación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}