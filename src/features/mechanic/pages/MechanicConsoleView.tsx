import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  PlusCircle,
  ShieldAlert,
  Play,
  CheckSquare,
  Square,
  Lock,
  User,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge, WorkOrderStatusBadge } from '../../../shared/components/Badge';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useToast } from '../../../shared/components/ToastContext';
import { workOrdersService } from '../../work-orders/api/work-orders-service';
import type { WorkOrder } from '../../../shared/types/openapi';
import { useMechanicOrders } from '../api/useMechanicOrders';

export const MechanicConsoleView: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const assignedOrdersQuery = useMechanicOrders();
  const workOrders: WorkOrder[] = assignedOrdersQuery.data?.data ?? [];

  // Additional work reporting modal (RN-03)
  const [reportingOt, setReportingOt] = useState<WorkOrder | null>(null);
  const [additionalDesc, setAdditionalDesc] = useState('');
  const [additionalHours, setAdditionalHours] = useState(2);
  const [additionalPartDesc, setAdditionalPartDesc] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const loadData = () => { void queryClient.invalidateQueries({ queryKey: ['work-orders', 'assigned'] }); };

  // RN-04: the backend scopes this list to the authenticated mechanic.
  const assignedOrders = workOrders;

  const handleToggleLabor = async (orderId: string, laborId: string) => {
    try {
      await workOrdersService.toggleLaborCompletion(orderId, laborId);
      toast.success('Estado de tarea actualizado');
      await loadData();
    } catch {
      toast.danger('No se pudo actualizar la tarea');
    }
  };

  const handleConfirmPartInstalled = async (orderId: string, partItemId: string) => {
    try {
      await workOrdersService.confirmPartInstalled(orderId, partItemId);
      toast.success(
        'Repuesto Instalado',
        'Stock descontado automáticamente del inventario.'
      );
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar repuesto';
      toast.danger('Fallo de Repuesto', msg);
    }
  };

  const handleReportAdditionalWork = async () => {
    if (!reportingOt || !additionalDesc.trim()) {
      toast.warning('Ingrese la descripción del daño o trabajo adicional detectado.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      // Automatic suspension RN-03
      await workOrdersService.reportAdditionalWork(
        reportingOt.id,
        additionalDesc,
        750, // Cost calculated by system/Jefe de Taller
        [
          {
            description: `[ADICIONAL RN-03] ${additionalDesc}`,
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
              description: `[ADICIONAL RN-03] ${additionalPartDesc}`,
              quantityRequired: 1,
              unitPriceBOB: 200,
              totalBOB: 200,
            },
          ]
          : []
      );

      toast.warning(
        'Trabajo Suspendido',
        'Se notificó al Jefe de Taller y al cliente. La orden queda pausada hasta confirmación explícita.'
      );
      setReportingOt(null);
      setAdditionalDesc('');
      setAdditionalPartDesc('');
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al reportar daño';
      toast.danger('Fallo al reportar', msg);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (assignedOrdersQuery.isPending) {
    return <LoadingSkeleton rows={4} />;
  }

  if (assignedOrdersQuery.isError) {
    return <EmptyState icon={<AlertTriangle className="w-8 h-8 text-red-600" />} title="No se pudieron cargar tus órdenes" description="Verifique que la sesión corresponda a un mecánico." actionLabel="Reintentar" onAction={loadData} />;
  }

  return (
    <div className="space-y-6 bg-slate-50 text-slate-900">
      {/* Top Header with Role Switcher & RN-16 Compliance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Consola del Mecánico
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Panel táctil de tareas en bahía, registro de diagnóstico, instalación de repuestos y reporte de imprevistos.
          </p>
        </div>

        {/* RN-16 Privacy Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
          <Lock className="w-3.5 h-3.5 text-lime-700" />
          <span>Vista técnica sin costos</span>
        </div>
      </div>

      <Card variant="public" padding="sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <User className="w-4 h-4 text-lime-700" />
          <span>Sesión del mecánico autenticado</span>
        </div>
      </Card>

      {/* Assigned Orders Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-lime-700" />
            Órdenes Asignadas ({assignedOrders.length})
          </h2>
          <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refrescar
          </Button>
        </div>

        {assignedOrders.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8 text-slate-500" />}
            title="Sin órdenes asignadas actualmente"
            description="No tienes vehículos en cola para tu puesto de trabajo. El Jefe de Taller te asignará la próxima orden disponible."
          />
        ) : (
          assignedOrders.map((ot) => {
            const isSuspended = ot.isSuspendedForAdditionalWork;

            return (
              <Card
                key={ot.id}
                variant="public"
                padding="md"
                className="space-y-4"
              >
                {/* OT Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-lime-900 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-lg">
                        {ot.code}
                      </span>
                      <span className="font-mono font-extrabold text-base text-slate-950 break-all">
                        {ot.vehiclePlate}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 break-words">
                        • {ot.vehicleBrand} {ot.vehicleModel} ({ot.vehicleYear})
                      </span>
                      {ot.assignedBayId && (
                        <span className="text-[10px] font-bold text-lime-900 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-md font-mono">
                          Bahía #{ot.assignedBayId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Cliente: <strong className="text-slate-950">{ot.clientName}</strong> | Tel: {ot.clientPhone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <WorkOrderStatusBadge status={ot.status} />
                  </div>
                </div>

                {/* RN-03 Suspension Alert if active */}
                {isSuspended && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-800">ORDEN SUSPENDIDA POR DAÑO ADICIONAL:</span>{' '}
                      {ot.additionalWorkDescription}. <em className="text-slate-600">Pausado hasta autorización del cliente.</em>
                    </div>
                  </div>
                )}

                {/* Entry Reason & Diagnostic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600 block mb-1">Motivo de Ingreso:</span>
                    <p className="text-slate-900">{ot.entryReason}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600 block mb-1">Diagnóstico Técnico:</span>
                    <p className="text-slate-900">
                      {ot.diagnosticReport || 'En proceso de evaluación en bahía.'}
                    </p>
                  </div>
                </div>

                {/* Labor Checklist (HU-03) - STRICTLY NO PRICES (RN-16) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-lime-700" />
                      Operaciones de Mano de Obra
                    </h3>
                    <span className="text-[10px] text-slate-500">Toque para completar</span>
                  </div>

                  {ot.laborItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay tareas de mano de obra registradas aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {ot.laborItems.map((lab) => (
                        <div
                          key={lab.id}
                          onClick={() => handleToggleLabor(ot.id, lab.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all min-h-[44px] ${lab.isCompleted
                            ? 'bg-lime-50 border-lime-200 text-lime-900'
                            : 'bg-white border-slate-200 hover:border-lime-300 text-slate-900'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-lime-700">
                              {lab.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-lime-700" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-medium ${lab.isCompleted ? 'line-through opacity-70 text-lime-900' : 'text-slate-900'
                                }`}
                            >
                              {lab.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              ⏱️ {lab.estimatedHours}h est.
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Parts Requisition & Installation (RN-07, RN-08) - STRICTLY NO PRICES (RN-16) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-lime-700" />
                      Repuestos Requeridos
                    </h3>
                  </div>

                  {ot.partsItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No se solicitaron repuestos para esta orden.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ot.partsItems.map((part) => {
                        const isInstalled = part.status === 'INSTALADO';

                        return (
                          <div
                            key={part.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-lime-900">
                                  {part.partCode}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  x{part.quantityRequired} un.
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-1">
                                {part.description}
                              </p>
                            </div>

                            {isInstalled ? (
                              <Badge variant="success" size="sm">
                                Instalado ✓
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfirmPartInstalled(ot.id, part.id)}
                                className="text-xs border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                              >
                                Confirmar Uso
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mechanic Actions Footer */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="warning"
                    className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-950 focus:ring-amber-300"
                    size="sm"
                    leftIcon={<AlertTriangle className="w-4 h-4" />}
                    onClick={() => setReportingOt(ot)}
                  >
                    Reportar Daño Adicional
                  </Button>

                  {ot.status === 'EN_PROGRESO' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="bg-lime-400 text-lime-900 hover:bg-lime-500 focus:ring-lime-400"
                      onClick={async () => {
                        try {
                          await workOrdersService.updateStatus(
                            ot.id,
                            'FINALIZADA',
                            'Mecánico autenticado (Trabajo completado)'
                          );
                          toast.success('OT Finalizada', 'Orden lista para control de calidad y liquidación.');
                          await loadData();
                        } catch (err) {
                          toast.danger('No se pudo finalizar la orden');
                        }
                      }}
                    >
                      Completar y Pasar a Control de Calidad
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Report Additional Work Modal (RN-03) */}
      <Modal
        isOpen={!!reportingOt}
        onClose={() => setReportingOt(null)}
        title={`Reportar Daño Oculto en ${reportingOt?.vehiclePlate}`}
        subtitle="Suspende automáticamente el avance en bahía y genera cotización adicional para el cliente"
        variant="light"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Descripción Técnica del Daño Oculto <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={3}
              value={additionalDesc}
              onChange={(e) => setAdditionalDesc(e.target.value)}
              placeholder="Ej: Fuga activa en retén de bancada al retirar protector de cárter..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Horas Adicionales Estimadas"
                type="number"
                value={additionalHours}
                onChange={(e) => setAdditionalHours(Number(e.target.value))}
                min={1}
                max={20}
                tone="light"
              />
            </div>

            <div>
              <Input
                label="Repuesto Adicional (Opcional)"
                value={additionalPartDesc}
                onChange={(e) => setAdditionalPartDesc(e.target.value)}
                placeholder="Ej: Retén trasero de cigüeñal OEM"
                tone="light"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
            ⚠️ <strong className="text-slate-950">Efecto Inmediato:</strong> La orden cambiará a estado <em className="text-amber-800">Suspendido</em>. Se notificará al cliente para aprobación formal.
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
            <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={() => setReportingOt(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              isLoading={isSubmittingReport}
              onClick={handleReportAdditionalWork}
              leftIcon={<ShieldAlert className="w-4 h-4" />}
            >
              Aplicar Suspensión
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
