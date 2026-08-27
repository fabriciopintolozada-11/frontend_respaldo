import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Clock,
  Wrench,
  Package,
  CheckCircle2,
  Printer,
  ShieldAlert,
  History,
  DollarSign,
  Send,
} from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { WorkOrderStatusBadge } from '../../../shared/components/Badge';
import { StatusPipeline } from '../../../shared/components/StatusPipeline';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { useToast } from '../../../shared/components/ToastContext';
import { workOrdersService } from '../api/work-orders-service';
import type { WorkOrder, WorkOrderStatus } from '../../../shared/types/openapi';

export interface WorkOrderDetailViewProps {
  orderId: string;
  onBack: () => void;
  onNavigateToBilling?: (orderId: string) => void;
  onNavigateToQuotation?: (orderId: string) => void;
}

export const WorkOrderDetailView: React.FC<WorkOrderDetailViewProps> = ({
  orderId,
  onBack,
  onNavigateToBilling,
  onNavigateToQuotation,
}) => {
  const toast = useToast();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transition confirmation modal
  const [targetStatus, setTargetStatus] = useState<WorkOrderStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState('');

  // Printable Report Mode
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const res = await workOrdersService.getById(orderId);
      setOrder(res.data);
    } catch {
      toast.danger('Error al cargar detalle de la orden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleTriggerTransition = async (status: WorkOrderStatus) => {
    if (!order) return;
    setIsTransitioning(true);
    try {
      await workOrdersService.updateStatus(
        order.id,
        status,
        'Jefe de Taller / Administración',
        transitionReason || undefined
      );
      toast.success(
        'Transición de Estado Exitosa',
        `La orden ${order.code} avanzó a estado ${status}.`
      );
      setTargetStatus(null);
      setTransitionReason('');
      await loadOrder();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      toast.danger('Transición Bloqueada', msg);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleApproveAdditionalWork = async () => {
    if (!order) return;
    try {
      await workOrdersService.approveAdditionalWork(order.id, 'PORTAL_WEB');
      toast.success('Trabajo Adicional Aprobado', 'Se levantó la suspensión en bahía.');
      await loadOrder();
    } catch {
      toast.danger('No se pudo aprobar el trabajo adicional');
    }
  };

  if (isLoading || !order) {
    return <LoadingSkeleton rows={6} />;
  }

  const isSuspended = order.isSuspendedForAdditionalWork;
  const isNoResponseAlert = order.daysWithoutClientResponse >= 15 && order.status === 'PRESUPUESTADA';

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver a la Lista
          </Button>
          <span className="font-mono text-xs font-bold text-slate-400">ID: {order.id}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => setIsPrintModalOpen(true)}
          >
            Generar Reporte Imprimible
          </Button>

          {onNavigateToQuotation && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => onNavigateToQuotation(order.id)}
            >
              Presupuesto / Cotización
            </Button>
          )}

          {onNavigateToBilling && order.status === 'FINALIZADA' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<DollarSign className="w-4 h-4" />}
              onClick={() => onNavigateToBilling(order.id)}
            >
              Liquidar Cuenta en BOB
            </Button>
          )}
        </div>
      </div>

      {/* Main Order Header Card */}
      <Card variant={isSuspended ? 'warning' : isNoResponseAlert ? 'danger' : 'default'} padding="lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-lime-800 bg-lime-100 border border-lime-300 px-3 py-1 rounded-xl">
                {order.code}
              </span>
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {order.vehiclePlate}
              </h1>
              <span className="text-sm font-semibold text-slate-500">
                • {order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})
              </span>
              <WorkOrderStatusBadge status={order.status} size="lg" />
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span>Cliente: <strong className="text-slate-900">{order.clientName}</strong></span>
              <span>CI/NIT: <strong className="text-slate-900">{order.clientDocument}</strong></span>
              <span>Tel: <strong className="text-slate-900">{order.clientPhone}</strong></span>
              <span>Ingreso: <strong className="text-slate-900">{new Date(order.entryDate).toLocaleDateString('es-BO')}</strong></span>
            </div>
          </div>

          <div className="text-left lg:text-right">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Costo Total Estimado</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {order.totalGeneralBOB.toLocaleString('es-BO')} BOB
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">
              Mano de Obra: {order.totalLaborBOB} Bs. | Repuestos: {order.totalPartsBOB} Bs.
            </span>
          </div>
        </div>

        {/* State Machine Visualizer */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Máquina de Estados Operativa
            </h3>
            <span className="text-[11px] text-slate-400">Toque un paso adyacente para realizar la transición</span>
          </div>

          <StatusPipeline
            currentStatus={order.status}
            isSuspendedForAdditionalWork={order.isSuspendedForAdditionalWork}
            daysWithoutClientResponse={order.daysWithoutClientResponse}
            interactive={true}
            onSelectNextStatus={(status) => setTargetStatus(status)}
          />
        </div>
      </Card>

      {/* Additional Work Banner */}
      {isSuspended && (
        <Card variant="warning" padding="md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-amber-950">
                  Suspensión Automática Activa por Trabajo Adicional
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  Motivo reportado: <strong className="text-amber-950">"{order.additionalWorkDescription}"</strong> (+{order.additionalWorkCostBOB} BOB).
                  El avance en bahía está congelado hasta recibir la aprobación formal del cliente.
                </p>
              </div>
            </div>
            <Button
              variant="success"
              size="md"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleApproveAdditionalWork}
              className="whitespace-nowrap"
            >
              Registrar Aprobación Cliente
            </Button>
          </div>
        </Card>
      )}

      {/* Grid of Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Diagnostics */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
              <FileText className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Diagnóstico & Motivo de Ingreso
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Síntomas Reportados por Cliente:</span>
                <p className="text-slate-800 font-medium">{order.entryReason}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Informe Técnico de Diagnóstico:</span>
                <p className="text-slate-800 font-medium">
                  {order.diagnosticReport || 'Diagnóstico preliminar pendiente de registro en bahía.'}
                </p>
              </div>

              {order.mechanicNotes && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Notas Técnicas del Mecánico:</span>
                  <p className="text-xs">{order.mechanicNotes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Audit Log */}
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
              <History className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Bitácora de Auditoría de Estados
              </h2>
            </div>

            <div className="space-y-3">
              {order.statusHistory.map((hist, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{hist.status}</span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(hist.timestamp).toLocaleString('es-BO')}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">Por: {hist.changedBy}</p>
                    {hist.reason && <p className="text-slate-500 italic mt-0.5">"{hist.reason}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Items */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Mano de Obra ({order.totalLaborBOB} BOB)
                </h2>
              </div>
              <span className="text-[10px] text-slate-500">Tarifa: 120 Bs./h</span>
            </div>

            {order.laborItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay ítems de mano de obra registrados.</p>
            ) : (
              <div className="space-y-2">
                {order.laborItems.map((lab) => (
                  <div
                    key={lab.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {lab.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-xs font-bold text-slate-900">
                          {lab.description}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-6 font-mono">
                        {lab.estimatedHours}h × {lab.hourlyRateBOB} Bs./h
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-900">
                      {lab.totalBOB} BOB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Repuestos & Materiales ({order.totalPartsBOB} BOB)
                </h2>
              </div>
              <span className="text-[10px] text-slate-500">{order.partsItems.length} ítems</span>
            </div>

            {order.partsItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No se requirieron repuestos para esta orden.</p>
            ) : (
              <div className="space-y-2">
                {order.partsItems.map((part) => (
                  <div
                    key={part.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {part.partCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {part.description}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        x{part.quantityRequired} un. a {part.unitPriceBOB} Bs. | Estado: <strong className="text-slate-800">{part.status}</strong>
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-900">
                      {part.totalBOB} BOB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={!!targetStatus}
        onClose={() => setTargetStatus(null)}
        title={`Confirmar Cambio de Estado a "${targetStatus}"`}
        subtitle="Reglas del taller: Las transiciones registran fecha, hora y responsable en la bitácora"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            ¿Desea cambiar el estado de la orden <strong className="text-slate-900">{order.code}</strong> de <strong className="text-amber-600">{order.status}</strong> a{' '}
            <strong className="text-lime-700">{targetStatus}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Motivo o Comentario (Opcional):</label>
            <input
              type="text"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="Ej: Aprobación telefónica, piezas recibidas en taller..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
            <Button variant="outline" onClick={() => setTargetStatus(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              isLoading={isTransitioning}
              onClick={() => targetStatus && handleTriggerTransition(targetStatus)}
            >
              Confirmar Transición
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Reporte Oficial de Orden de Trabajo"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-slate-800">
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-slate-900">TALLER MECÁNICO "LOS FRATELLI"</h2>
              <p className="text-xs text-slate-600">
                Especialistas en Vehículos Livianos • 4 Bahías de Servicio Certificadas
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Av. Arce #2410, La Paz - Bolivia • Tel: +591 2 2441920</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-slate-900">{order.code}</span>
              <p className="text-[10px] text-slate-500">{new Date().toLocaleDateString('es-BO')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-bold text-[10px] uppercase text-slate-500">Datos del Cliente:</span>
              <p className="font-bold text-slate-900 text-xs">{order.clientName}</p>
              <p className="text-slate-600">CI/NIT: {order.clientDocument}</p>
              <p className="text-slate-600">Teléfono: {order.clientPhone}</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-bold text-[10px] uppercase text-slate-500">Datos del Vehículo:</span>
              <p className="font-bold text-slate-900 text-xs">{order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})</p>
              <p className="font-mono font-bold text-slate-900">Placa: {order.vehiclePlate}</p>
              <p className="text-slate-600">Estado OT: {order.status}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase text-[10px] text-slate-500">Desglose de Liquidación Proforma (BOB):</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Concepto</th>
                    <th className="p-2.5">Cant / Horas</th>
                    <th className="p-2.5 text-right">Monto (BOB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {order.laborItems.map((l) => (
                    <tr key={l.id}>
                      <td className="p-2.5 text-slate-900">Mano de Obra: {l.description}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{l.estimatedHours} hrs</td>
                      <td className="p-2.5 text-right font-mono text-slate-900">{l.totalBOB} Bs.</td>
                    </tr>
                  ))}
                  {order.partsItems.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2.5 text-slate-900">Repuesto: {p.partCode} - {p.description}</td>
                      <td className="p-2.5 text-slate-500 font-mono">x{p.quantityRequired}</td>
                      <td className="p-2.5 text-right font-mono text-slate-900">{p.totalBOB} Bs.</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={2} className="p-2.5 text-right text-xs uppercase text-slate-500">TOTAL GENERAL:</td>
                    <td className="p-2.5 text-right font-mono text-sm text-slate-900">{order.totalGeneralBOB} BOB</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-2 gap-6 text-center text-xs">
            <div className="border-t border-slate-200 pt-2">
              <p className="font-semibold text-slate-900">Firma Jefe de Taller</p>
              <p className="text-[10px] text-slate-500">Taller Mecánico Los Fratelli</p>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <p className="font-semibold text-slate-900">Firma / Conformidad Cliente</p>
              <p className="text-[10px] text-slate-500">{order.clientName}</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => {
                window.print();
                toast.info('Diálogo de impresión enviado');
              }}
            >
              Imprimir Reporte
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};