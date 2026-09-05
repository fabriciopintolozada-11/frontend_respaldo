import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Package,
  Stethoscope,
  User,
  Wrench,
} from 'lucide-react';

import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Badge, WorkOrderStatusBadge } from '../../shared/components/Badge';
import { StatusPipeline } from '../../shared/components/StatusPipeline';
import { Modal } from '../../shared/components/Modal';
import { EmptyState } from '../../shared/components/EmptyState';
import { useToast } from '../../shared/components/ToastContext';
import { useWorkshop } from '../../state/WorkshopContext';
import type { WorkOrderStatus } from '../../types/workshop';
import {
  translateConsumePartError,
  useConsumeSparePart,
} from '../work-orders/api/useConsumeSparePart';
import {
  ReservedPartsPanel,
  type ReservedPartLine,
} from '../work-orders/components/ReservedPartsPanel';
import { DiagnosticFormModal } from './DiagnosticFormModal';

const NEXT_STEP_LABEL: Record<WorkOrderStatus, string> = {
  REGISTRADA: 'Iniciar Diagnóstico',
  RECIBIDO: 'Iniciar Diagnóstico',
  ASIGNADA: 'Registrar Diagnóstico',
  EN_DIAGNOSTICO: 'Completar Diagnóstico',
  DIAGNOSTICADA: 'Generar Presupuesto',
  PRESUPUESTO_ENVIADO: 'Registrar Aprobación',
  APROBADO: 'Asignar a Bahía',
  RECHAZADO: '',
  EN_PROGRESO: 'Finalizar Trabajo',
  EN_REPARACION: 'Finalizar Trabajo',
  EN_ESPERA_REPUESTO: 'Reanudar (En Progreso)',
  ESPERANDO_REPUESTO: 'Reanudar (En Reparación)',
  FINALIZADA: 'Marcar Entregada',
  FINALIZADO: 'Marcar Entregado',
  LISTO_ENTREGA: 'Marcar Entregado',
  ENTREGADA: '',
  ENTREGADO: '',
  CANCELADA: '',
};

export function WorkOrderDetailView() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const toast = useToast();

  const {
    workOrders,
    mechanics,
    inventory,
    updateStatus,
    startDiagnostic,
    completeDiagnostic,
    saveDiagnosticDraft,
    confirmPartInstalled,
    refresh,
  } = useWorkshop();

  const consumePart = useConsumeSparePart();
  const [pendingPartId, setPendingPartId] = useState<string | null>(null);

  const [targetStatus, setTargetStatus] = useState<WorkOrderStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

  const order = workOrders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <EmptyState
        icon={<FileText className="w-8 h-8 text-slate-400" />}
        title="Orden no encontrada"
        description="La orden de trabajo solicitada no existe o fue eliminada."
        actionLabel="Volver a la lista"
        onAction={() => navigate('/ots')}
      />
    );
  }

  const primaryMech = mechanics.find((m) => m.id === order.primaryMechanicId);
  const assistantMech = mechanics.find((m) => m.id === order.assistantMechanicId);

  const handleTriggerTransition = (status: WorkOrderStatus) => {
    try {
      if (status === 'EN_DIAGNOSTICO') {
        startDiagnostic(order.id, 'Jefe de Taller / Administración');
        toast.success('Diagnóstico iniciado', `${order.code} en estado "En Diagnóstico".`);
      } else {
        updateStatus(order.id, status, 'Jefe de Taller / Administración', transitionReason || undefined);
        toast.success('Transición de Estado Exitosa', `La orden ${order.code} avanzó a estado ${status}.`);
      }
      setTargetStatus(null);
      setTransitionReason('');
      refresh();
    } catch (err) {
      toast.danger('Transición Bloqueada', err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  // HU-07: reserved spare part lines mapped to the contract expected by the
  // consume-part endpoint. quotePartId (approved quote part) is required.
  const reservedPartLines: ReservedPartLine[] = order.partsItems
    .filter((p) => p.status === 'RESERVADO')
    .map((p) => ({
      quotePartId: p.quotePartId ?? p.id,
      id: p.id,
      code: p.partCode,
      name: p.description,
      reservedQuantity: p.quantityRequired,
      usedQuantity: p.quantityUsed,
      status: p.status,
      unitPriceBOB: p.unitPriceBOB,
    }));

  const handleConfirmPartUsage = async (part: ReservedPartLine, quantity: number) => {
    setPendingPartId(part.quotePartId);
    try {
      await consumePart.mutateAsync({
        workOrderId: order.id,
        quotePartId: part.quotePartId,
        quantity,
      });
      toast.success(
        'Repuesto instalado',
        `${part.code} (${part.name}) se consumió del inventario automáticamente.`,
      );
      // Keep the workshop local store in sync with the confirmed consumption.
      try {
        confirmPartInstalled(order.id, part.id);
      } catch {
        /* local reflect is best-effort; backend is the source of truth */
      }
      refresh();
    } catch (err) {
      const details = translateConsumePartError(err);
      toast.danger('No se pudo confirmar el uso', details.message);
    } finally {
      setPendingPartId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/ots')}>
            Volver a la Lista
          </Button>
          <span className="font-mono text-xs font-bold text-slate-600">ID: {order.id}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(order.status === 'REGISTRADA' || order.status === 'EN_DIAGNOSTICO') && (
            <Button variant="warning" size="sm" leftIcon={<Stethoscope className="w-4 h-4" />} onClick={() => setDiagnosticOpen(true)}>
              Registrar Diagnóstico (HU-02)
            </Button>
          )}
          {NEXT_STEP_LABEL[order.status] && (
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setTargetStatus(order.status === 'DIAGNOSTICADA' ? 'PRESUPUESTO_ENVIADO' : nextStatus(order.status))}
            >
              {NEXT_STEP_LABEL[order.status]}
            </Button>
          )}
        </div>
      </div>

      <Card variant={order.isSuspendedForAdditionalWork ? 'warning' : 'default'} padding="lg" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#F97316] bg-[#F9731615] border border-[#F9731630] px-3 py-1 rounded-xl">
                {order.code}
              </span>
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{order.vehiclePlate}</h1>
              <span className="text-sm font-semibold text-slate-600">
                • {order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})
              </span>
              <WorkOrderStatusBadge status={order.status} size="lg" className="!bg-slate-100 !text-slate-700 !border-slate-200" />
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span>
                Cliente: <strong className="text-slate-800">{order.clientName}</strong>
              </span>
              <span>
                CI/NIT: <strong className="text-slate-800">{order.clientDocument}</strong>
              </span>
              <span>
                Ingreso: <strong className="text-slate-800">{new Date(order.entryDate).toLocaleDateString('es-BO')}</strong>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {order.assignedBayId && (
                <Badge variant="purple" className="!bg-purple-50 !text-purple-700 !border-purple-200">Bahía #{order.assignedBayId}</Badge>
              )}
              {primaryMech && (
                <Badge variant="amber" className="!bg-amber-50 !text-amber-700 !border-amber-200">
                  <User className="w-3 h-3" /> {primaryMech.name} (Principal)
                </Badge>
              )}
              {assistantMech && <Badge variant="slate" className="!bg-slate-100 !text-slate-700 !border-slate-200">Ayudante: {assistantMech.name}</Badge>}
            </div>
          </div>

          <div className="text-left lg:text-right">
            <span className="text-[10px] font-semibold text-slate-600 block uppercase tracking-wider">Costo Total Estimado</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {order.totalGeneralBOB.toLocaleString('es-BO')} BOB
            </span>
            <span className="text-[11px] text-slate-600 block mt-0.5 font-mono">
              Mano de Obra: {order.totalLaborBOB} Bs. | Repuestos: {order.totalPartsBOB} Bs.
            </span>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Máquina de Estados Operativa</h3>
            <span className="text-[11px] text-slate-600">Toque un paso adyacente para realizar la transición</span>
          </div>
          <StatusPipeline
            currentStatus={order.status}
            interactive
            tone="light"
            onSelectNextStatus={(status) => setTargetStatus(status)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card padding="md" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
              <FileText className="w-4 h-4 text-[#F97316]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Diagnóstico & Motivo de Ingreso</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Síntomas Reportados por Cliente:</span>
                <p className="text-slate-700">{order.entryReason}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Informe Técnico de Diagnóstico:</span>
                <p className="text-slate-700">{order.diagnosticReport ?? 'Diagnóstico preliminar pendiente de registro.'}</p>
                {order.diagnosticDate && (
                  <p className="text-[10px] text-slate-600 mt-1 font-mono">
                    Registrado: {new Date(order.diagnosticDate).toLocaleString('es-BO')}
                  </p>
                )}
              </div>
              {order.mechanicNotes && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-slate-700">
                  <span className="text-[10px] uppercase font-bold text-[#F97316] block mb-1">Notas Técnicas del Mecánico:</span>
                  <p>{order.mechanicNotes}</p>
                </div>
              )}
            </div>
          </Card>

          <Card padding="md" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
              <History className="w-4 h-4 text-[#F97316]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Bitácora de Auditoría de Estados</h2>
            </div>
            <div className="space-y-3">
              {(order.statusHistory ?? []).map((hist, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 mt-1.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{hist.status}</span>
                      <span className="text-slate-600 font-mono text-[10px]">{new Date(hist.timestamp).toLocaleString('es-BO')}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">Por: {hist.changedBy}</p>
                    {hist.reason && <p className="text-slate-600 italic mt-0.5">"{hist.reason}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card padding="md" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#F97316]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Mano de Obra ({order.totalLaborBOB} BOB)</h2>
              </div>
              <span className="text-[10px] text-slate-600">Tarifa: 120 Bs./h</span>
            </div>
            {(order.laborItems ?? []).length === 0 ? (
              <p className="text-xs text-slate-600 italic">No hay ítems de mano de obra registrados.</p>
            ) : (
              <div className="space-y-2">
                {(order.laborItems ?? []).map((lab) => (
                  <div key={lab.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {lab.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#F97316]" />
                        )}
                        <span className="text-xs font-semibold text-slate-800">{lab.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-600 ml-6 font-mono">
                        {lab.estimatedHours}h × {lab.hourlyRateBOB} Bs./h
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#F97316]">{lab.totalBOB} BOB</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="md" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#F97316]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Repuestos & Materiales ({order.totalPartsBOB} BOB)</h2>
              </div>
              <span className="text-[10px] text-slate-600">{(order.partsItems ?? []).length} ítems</span>
            </div>
            {(order.partsItems ?? []).length === 0 ? (
              <p className="text-xs text-slate-600 italic">No se requirieron repuestos para esta orden.</p>
            ) : (
              <div className="space-y-2">
                {(order.partsItems ?? []).map((part) => (
                  <div key={part.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#F97316]">{part.partCode}</span>
                        <span className="text-xs font-semibold text-slate-800">{part.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-600">
                        x{part.quantityRequired} un. a {part.unitPriceBOB} Bs. | Estado:{' '}
                        <strong className="text-slate-800">{part.status}</strong>
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#F97316]">{part.totalBOB} BOB</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* HU-07: confirm use/installation of reserved spare parts (US-07) */}
          <ReservedPartsPanel
            parts={reservedPartLines}
            userRole="WORKSHOP_LEAD"
            onConfirm={handleConfirmPartUsage}
            isPending={consumePart.isPending}
            pendingPartId={pendingPartId}
          />
        </div>
      </div>

      <Modal
        isOpen={!!targetStatus}
        variant="light"
        onClose={() => setTargetStatus(null)}
        title={`Confirmar Cambio de Estado a "${targetStatus}"`}
        subtitle="Reglas del taller: Las transiciones registran fecha, hora y responsable en la bitácora"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            ¿Desea cambiar el estado de la orden <strong className="text-slate-900">{order.code}</strong> de{' '}
            <strong className="text-[#F97316]">{order.status}</strong> a <strong className="text-[#22C55E]">{targetStatus}</strong>?
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Motivo o Comentario (Opcional):</label>
            <input
              type="text"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="Ej: Aprobación telefónica, piezas recibidas en taller..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
            <Button variant="outline" onClick={() => setTargetStatus(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => targetStatus && handleTriggerTransition(targetStatus)}>
              Confirmar Transición
            </Button>
          </div>
        </div>
      </Modal>

      <DiagnosticFormModal
        order={order}
        mechanics={mechanics}
        inventory={inventory}
        isOpen={diagnosticOpen}
        changedBy="Jefe de Taller / Administración"
        onClose={() => setDiagnosticOpen(false)}
        onSaveDraft={(payload) => {
          try {
            saveDiagnosticDraft(order.id, payload, 'Jefe de Taller / Administración');
            toast.success('Borrador guardado', `${order.code} en estado "En Diagnóstico".`);
            setDiagnosticOpen(false);
            refresh();
          } catch (err) {
            toast.danger('No se pudo guardar', err instanceof Error ? err.message : 'Error');
          }
        }}
        onComplete={(payload) => {
          try {
            completeDiagnostic(order.id, payload, 'Jefe de Taller / Administración');
            toast.success('Diagnóstico Completado', `${order.code} pasó a "Diagnóstico Completado".`);
            setDiagnosticOpen(false);
            refresh();
          } catch (err) {
            toast.danger('No se pudo completar', err instanceof Error ? err.message : 'Error');
          }
        }}
      />
    </div>
  );
}

function nextStatus(status: WorkOrderStatus): WorkOrderStatus {
  switch (status) {
    case 'REGISTRADA':
      return 'EN_DIAGNOSTICO';
    case 'EN_DIAGNOSTICO':
      return 'DIAGNOSTICADA';
    case 'DIAGNOSTICADA':
      return 'PRESUPUESTO_ENVIADO';
    case 'PRESUPUESTO_ENVIADO':
      return 'APROBADO';
    case 'APROBADO':
      return 'EN_PROGRESO';
    case 'EN_PROGRESO':
      return 'FINALIZADA';
    case 'EN_ESPERA_REPUESTO':
      return 'EN_PROGRESO';
    case 'FINALIZADA':
      return 'ENTREGADA';
    default:
      return status;
  }
}
