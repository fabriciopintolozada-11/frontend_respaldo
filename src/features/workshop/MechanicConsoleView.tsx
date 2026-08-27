import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  Package,
  RefreshCw,
  Square,
  Stethoscope,
  User,
  Wrench,
} from 'lucide-react';

import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Badge, WorkOrderStatusBadge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { useToast } from '../../shared/components/ToastContext';
import { useWorkshop } from '../../state/WorkshopContext';
import type { WorkOrder } from '../../types/workshop';
import { DiagnosticFormModal } from './DiagnosticFormModal';

export function MechanicConsoleView() {
  const toast = useToast();
  const {
    mechanics,
    workOrders,
    inventory,
    refresh,
    toggleLaborCompletion,
    confirmPartInstalled,
    updateStatus,
    completeDiagnostic,
    saveDiagnosticDraft,
  } = useWorkshop();

  const [selectedMechanicId, setSelectedMechanicId] = useState('MEC-01');
  const [diagnosingOrder, setDiagnosingOrder] = useState<WorkOrder | null>(null);

  const activeMechanic = mechanics.find((m) => m.id === selectedMechanicId);

  const assignedOrders = useMemo(
    () =>
      workOrders.filter(
        (o) => o.primaryMechanicId === selectedMechanicId || o.assistantMechanicId === selectedMechanicId,
      ),
    [workOrders, selectedMechanicId],
  );

  const handleToggleLabor = (orderId: string, laborId: string) => {
    try {
      toggleLaborCompletion(orderId, laborId);
      toast.success('Estado de tarea actualizado');
      refresh();
    } catch {
      toast.danger('No se pudo actualizar la tarea');
    }
  };

  const handleConfirmPartInstalled = (orderId: string, partItemId: string) => {
    try {
      confirmPartInstalled(orderId, partItemId);
      toast.success('Repuesto Instalado (RN-07, RN-08)', 'Stock descontado automáticamente del inventario.');
      refresh();
    } catch (err) {
      toast.danger('Fallo de Repuesto', err instanceof Error ? err.message : 'Error al registrar repuesto');
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Consola del Mecánico</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Tareas en bahía, diagnóstico técnico y registro de repuestos. Asignaciones visibles desde el Jefe de Taller.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
          <Lock className="w-3.5 h-3.5 text-lime-700" />
          <span>RN-16: Vista técnica sin costos</span>
        </div>
      </div>

      <Card variant="public" padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            <User className="w-4 h-4 text-lime-700" />
            <span>Mecánico Activo:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mechanics.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMechanicId(m.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${selectedMechanicId === m.id
                    ? 'bg-lime-400 text-lime-900 shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:border-lime-300'
                  }`}
              >
                {m.name} ({m.specialty})
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-lime-700" />
            Órdenes Asignadas ({assignedOrders.length})
          </h2>
          <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={refresh} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refrescar
          </Button>
        </div>

        {assignedOrders.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8 text-slate-500" />}
            title="Sin órdenes asignadas actualmente"
            description="No tienes vehículos en cola para tu puesto. El Jefe de Taller te asignará la próxima orden disponible."
          />
        ) : (
          assignedOrders.map((ot) => {
            const isSuspended = ot.isSuspendedForAdditionalWork;
            const isDiagnosable = ot.status === 'REGISTRADA' || ot.status === 'EN_DIAGNOSTICO';

            return (
              <Card key={ot.id} variant="public" padding="md" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-lime-900 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-lg">
                        {ot.code}
                      </span>
                      <span className="font-mono font-extrabold text-base text-slate-950">{ot.vehiclePlate}</span>
                      <span className="text-xs font-semibold text-slate-600">
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
                  <WorkOrderStatusBadge status={ot.status} />
                </div>

                {isSuspended && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <span className="font-bold text-amber-800">ORDEN SUSPENDIDA POR DAÑO ADICIONAL (RN-03):</span>{' '}
                        {ot.additionalWorkDescription}. <em className="text-slate-600">Pausado hasta autorización del cliente.</em>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600 block mb-1">Motivo de Ingreso:</span>
                    <p className="text-slate-900">{ot.entryReason}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600 block mb-1">Diagnóstico Técnico:</span>
                    <p className="text-slate-900">{ot.diagnosticReport ?? 'En proceso de evaluación en bahía.'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Operaciones de Mano de Obra</h3>
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
                            {lab.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-lime-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                            <span className={`text-xs font-medium ${lab.isCompleted ? 'line-through opacity-70 text-lime-900' : 'text-slate-900'}`}>
                              {lab.description}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {lab.estimatedHours}h est.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-lime-700" />
                    Repuestos Requeridos
                  </h3>
                  {ot.partsItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No se solicitaron repuestos para esta orden.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ot.partsItems.map((part) => {
                        const isInstalled = part.status === 'INSTALADO';
                        return (
                          <div key={part.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-lime-900">{part.partCode}</span>
                                <span className="text-xs font-bold text-slate-900">x{part.quantityRequired} un.</span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-1">{part.description}</p>
                            </div>
                            {isInstalled ? (
                              <Badge variant="success" size="sm">
                                Instalado ✓
                              </Badge>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleConfirmPartInstalled(ot.id, part.id)} className="text-xs border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                                Confirmar Uso (RN-08)
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  {isDiagnosable && (
                    <Button variant="warning" size="sm" className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-950 focus:ring-amber-300" leftIcon={<Stethoscope className="w-4 h-4" />} onClick={() => setDiagnosingOrder(ot)}>
                      Registrar Diagnóstico (HU-02)
                    </Button>
                  )}
                  {ot.status === 'EN_PROGRESO' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="bg-lime-400 text-lime-900 hover:bg-lime-500 focus:ring-lime-400"
                      onClick={() => {
                        try {
                          updateStatus(ot.id, 'FINALIZADA', `${activeMechanic?.name} (Trabajo completado)`);
                          toast.success('OT Finalizada', 'Orden lista para control de calidad y liquidación.');
                          refresh();
                        } catch (err) {
                          toast.danger('No se pudo finalizar', err instanceof Error ? err.message : 'Error');
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

      {diagnosingOrder && (
        <DiagnosticFormModal
          order={diagnosingOrder}
          mechanics={mechanics}
          inventory={inventory}
          isOpen={!!diagnosingOrder}
          changedBy={activeMechanic?.id ?? 'MEC-01'}
          onClose={() => setDiagnosingOrder(null)}
          onSaveDraft={(payload) => {
            try {
              saveDiagnosticDraft(diagnosingOrder.id, payload, activeMechanic?.name ?? 'Mecánico');
              toast.success('Borrador guardado', `${diagnosingOrder.code} en estado "En Diagnóstico".`);
              setDiagnosingOrder(null);
              refresh();
            } catch (err) {
              toast.danger('No se pudo guardar', err instanceof Error ? err.message : 'Error');
            }
          }}
          onComplete={(payload) => {
            try {
              completeDiagnostic(diagnosingOrder.id, payload, activeMechanic?.name ?? 'Mecánico');
              toast.success('Diagnóstico Completado', `${diagnosingOrder.code} pasó a "Diagnóstico Completado".`);
              setDiagnosingOrder(null);
              refresh();
            } catch (err) {
              toast.danger('No se pudo completar', err instanceof Error ? err.message : 'Error');
            }
          }}
        />
      )}
    </div>
  );
}
