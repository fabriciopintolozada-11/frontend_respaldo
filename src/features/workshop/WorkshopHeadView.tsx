import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  Eye,
  Layers,
  LayoutDashboard,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  Users,
  Wrench,
} from 'lucide-react';

import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { BayStatusBadge, WorkOrderStatusBadge } from '../../shared/components/Badge';
import { MetricCard } from '../../shared/components/MetricCard';
import { Modal } from '../../shared/components/Modal';
import { EmptyState } from '../../shared/components/EmptyState';
import { useToast } from '../../shared/components/ToastContext';
import { useWorkshop } from '../../state/WorkshopContext';
import type { Bay, BayStatus, WorkOrder } from '../../types/workshop';
import { DiagnosticFormModal } from './DiagnosticFormModal';

export function WorkshopHeadView() {
  const navigate = useNavigate();
  const toast = useToast();
  const { bays, workOrders, mechanics, inventory, metrics, refresh, assignBayAndMechanic, updateBayStatus, completeDiagnostic, saveDiagnosticDraft } =
    useWorkshop();

  const [selectedBayForAssign, setSelectedBayForAssign] = useState<Bay | null>(null);
  const [selectedOtCode, setSelectedOtCode] = useState('');
  const [selectedPrimaryMechanic, setSelectedPrimaryMechanic] = useState('');
  const [selectedAssistantMechanic, setSelectedAssistantMechanic] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [bayToEditStatus, setBayToEditStatus] = useState<Bay | null>(null);
  const [newBayStatus, setNewBayStatus] = useState<BayStatus>('LIBRE');

  const [diagnosingOrder, setDiagnosingOrder] = useState<WorkOrder | null>(null);

  const unassignedOrders = useMemo(
    () =>
      workOrders.filter(
        (o) =>
          (o.status === 'REGISTRADA' || o.status === 'EN_DIAGNOSTICO' || o.status === 'DIAGNOSTICADA' || o.status === 'APROBADA') &&
          !o.assignedBayId,
      ),
    [workOrders],
  );

  const pendingDiagnosis = useMemo(
    () => workOrders.filter((o) => o.status === 'REGISTRADA' || o.status === 'EN_DIAGNOSTICO'),
    [workOrders],
  );

  const rn03Suspended = useMemo(() => workOrders.filter((o) => o.isSuspendedForAdditionalWork), [workOrders]);
  const rn06Alert = useMemo(
    () => workOrders.filter((o) => o.daysWithoutClientResponse >= 15 && o.status === 'PRESUPUESTADA'),
    [workOrders],
  );

  const handleOpenAssignModal = (bay: Bay) => {
    setSelectedBayForAssign(bay);
    const candidates = unassignedOrders;
    setSelectedOtCode(candidates[0]?.code ?? '');
    setSelectedPrimaryMechanic(mechanics[0]?.id ?? '');
    setSelectedAssistantMechanic('');
  };

  const handleConfirmAssignment = () => {
    if (!selectedBayForAssign || !selectedOtCode || !selectedPrimaryMechanic) {
      toast.warning('Datos incompletos', 'Seleccione la OT y el mecánico principal.');
      return;
    }
    setIsAssigning(true);
    try {
      assignBayAndMechanic(selectedOtCode, selectedBayForAssign.id, selectedPrimaryMechanic, selectedAssistantMechanic || undefined);
      toast.success(
        'OT Asignada con Éxito',
        `Orden ${selectedOtCode} asignada a ${selectedBayForAssign.name}.`,
      );
      setSelectedBayForAssign(null);
      refresh();
    } catch (err) {
      toast.danger('Fallo en Asignación', err instanceof Error ? err.message : 'Error en la asignación');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateBayStatus = () => {
    if (!bayToEditStatus) return;
    try {
      updateBayStatus(bayToEditStatus.id, newBayStatus);
      toast.success(`Estado de ${bayToEditStatus.name} actualizado a ${newBayStatus}`);
      setBayToEditStatus(null);
      refresh();
    } catch {
      toast.danger('No se pudo actualizar el estado de la bahía');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Panel del Jefe de Taller</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Gestión de bahías, asignación de OTs y mecánicos, y diagnóstico técnico inicial.
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={refresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Actualizar Tablero
        </Button>
      </div>

      {(rn06Alert.length > 0 || rn03Suspended.length > 0) && (
        <div className="space-y-3">
          {rn06Alert.map((ot) => (
            <div
              key={ot.id}
              className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-10 bg-red-500 rounded-full shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-950">
                    <span className="text-red-700">ALERTA:</span> Orden {ot.code} ({ot.vehiclePlate}) superó 15 días sin respuesta
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Presupuesto de <strong className="text-slate-950">{ot.totalGeneralBOB} BOB</strong> ·{' '}
                    <strong className="text-red-700">{ot.daysWithoutClientResponse} días</strong>
                  </p>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => navigate(`/ots/${ot.id}`)} className="whitespace-nowrap w-full sm:w-auto">
                Ver OT
              </Button>
            </div>
          ))}
          {rn03Suspended.map((ot) => (
            <div
              key={ot.id}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-10 bg-amber-500 rounded-full shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-950">
                    <span className="text-amber-800">ORDEN SUSPENDIDA:</span> Orden {ot.code} ({ot.vehiclePlate})
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {ot.additionalWorkDescription} (+{ot.additionalWorkCostBOB} BOB)
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/ots/${ot.id}`)} className="whitespace-nowrap w-full sm:w-auto min-h-[44px] border-amber-300 bg-white text-amber-800 hover:bg-amber-50 hover:text-amber-950">
                Revisar
              </Button>
            </div>
          ))}
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Ocupación de Bahías"
            value={`${metrics.bayOccupancyRatePercent}%`}
            subtitle={`${metrics.occupiedBays + metrics.waitingPartsBays} de ${metrics.totalBays} bahías activas`}
            icon={<Layers className="w-5 h-5" />}
            theme="light"
          />
          <MetricCard
            title="Órdenes Activas"
            value={metrics.activeWorkOrdersCount}
            subtitle="En progreso, espera o aprobadas"
            icon={<Wrench className="w-5 h-5" />}
            theme="light"
          />
          <MetricCard
            title="Mecánicos en Bahía"
            value={`${metrics.mechanicsActive} / ${metrics.totalMechanics}`}
            subtitle="Personal técnico asignado"
            icon={<Users className="w-5 h-5" />}
            theme="light"
          />
          <MetricCard
            title="En Diagnóstico"
            value={metrics.enDiagnosticoCount}
            subtitle="OTs con diagnóstico en curso"
            icon={<Stethoscope className="w-5 h-5" />}
            theme="light"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-500" />
            Estado de las 4 Bahías de Trabajo
          </h2>
          <span className="text-xs text-slate-600 font-mono">Capacidad: 4 puestos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bays.map((bay) => {
            const primaryMech = mechanics.find((m) => m.id === bay.primaryMechanicId);
            const assistantMech = mechanics.find((m) => m.id === bay.assistantMechanicId);
            const currentOt = workOrders.find((o) => o.code === bay.currentWorkOrderId);

            const isFree = bay.status === 'LIBRE';
            const isOccupied = bay.status === 'OCUPADA';

            return (
              <Card
                key={bay.id}
                variant="public"
                padding="md"
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-lime-800 bg-lime-50 px-2 py-0.5 rounded border border-lime-200">
                          {bay.code}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-950">{bay.name}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{bay.type}</p>
                    </div>
                    <BayStatusBadge status={bay.status} />
                  </div>

                  <div className="py-4 space-y-3">
                    {isFree ? (
                      <div className="py-6 text-center text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-sm font-semibold text-slate-950">Bahía disponible sin vehículo asignado</p>
                        <p className="text-xs mt-1 text-slate-600">Listo para recibir órdenes aprobadas en espera.</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Vehículo en Bahía</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-base text-slate-950">{bay.currentVehiclePlate}</span>
                              <span className="text-xs text-slate-600">• {bay.currentVehicleModel}</span>
                            </div>
                          </div>
                          {bay.currentWorkOrderId && (
                            <span className="font-mono text-xs font-bold text-lime-800 bg-lime-50 border border-lime-200 px-2.5 py-1 rounded-lg">
                              {bay.currentWorkOrderId}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-bold">Mecánico Principal</span>
                            <span className="font-bold text-slate-950 block mt-0.5 truncate">{primaryMech?.name ?? 'Sin asignar'}</span>
                            <span className="text-[10px] text-lime-700 block mt-0.5">{primaryMech?.specialty}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider block font-bold">Ayudante Técnico</span>
                            <span className="font-bold text-slate-950 block mt-0.5 truncate">{assistantMech?.name ?? 'No asignado'}</span>
                            <span className="text-[10px] text-slate-600 block mt-0.5">Apoyo secundario</span>
                          </div>
                        </div>

                        {bay.notes && (
                          <div className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <strong className="text-slate-950">Notas:</strong> {bay.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                    onClick={() => {
                      setBayToEditStatus(bay);
                      setNewBayStatus(bay.status);
                    }}
                  >
                    Cambiar Estado
                  </Button>
                  {isFree ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<PlusCircle className="w-4 h-4" />}
                      onClick={() => handleOpenAssignModal(bay)}
                    >
                      Asignar OT a Bahía
                    </Button>
                  ) : (
                    currentOt && (
                      <Button variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" leftIcon={<Eye className="w-4 h-4" />} onClick={() => navigate(`/ots/${currentOt.id}`)}>
                        Ver Detalle OT
                      </Button>
                    )
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card variant="public" padding="md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-lime-700" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Órdenes en Espera de Diagnóstico o Asignación
            </h2>
          </div>
          <span className="text-xs text-slate-600 font-mono">{unassignedOrders.length} pendientes</span>
        </div>

        {unassignedOrders.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8 text-slate-400" />}
            title="Sin órdenes pendientes"
            description="Todas las órdenes tienen bahía asignada o diagnóstico completado."
          />
        ) : (
          <div className="space-y-2">
            {unassignedOrders.map((ot) => (
              <div
                key={ot.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-lime-800 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-lg">
                      {ot.code}
                    </span>
                    <span className="font-mono font-extrabold text-sm text-slate-950">{ot.vehiclePlate}</span>
                    <span className="text-xs text-slate-600">
                      • {ot.vehicleBrand} {ot.vehicleModel}
                    </span>
                    <WorkOrderStatusBadge status={ot.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {ot.clientName} · {ot.entryReason}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(ot.status === 'REGISTRADA' || ot.status === 'EN_DIAGNOSTICO') && (
                    <Button variant="primary" size="sm" leftIcon={<Stethoscope className="w-4 h-4" />} onClick={() => setDiagnosingOrder(ot)}>
                      Registrar Diagnóstico
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={() => navigate(`/ots/${ot.id}`)}>
                    Ver OT
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card variant="public" padding="md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-lime-700" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Personal Técnico del Taller</h2>
          </div>
          <span className="text-xs text-slate-600 font-mono">{mechanics.length} técnicos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {mechanics.map((mech) => (
            <div key={mech.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-950">{mech.name}</h4>
                <p className="text-xs text-lime-700 font-medium">{mech.specialty}</p>
                <p className="text-[11px] text-slate-600 mt-1 font-mono">Tel: {mech.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-950 block">{mech.activeOtCount} OTs</span>
                <span className="text-[10px] text-slate-600 font-mono">{mech.currentBayId ? `Bahía ${mech.currentBayId}` : 'En espera'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        variant="light"
        isOpen={!!selectedBayForAssign}
        onClose={() => setSelectedBayForAssign(null)}
        title={`Asignar Orden de Trabajo a ${selectedBayForAssign?.name}`}
        subtitle="Asigna un mecánico principal y un ayudante a la orden de trabajo."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="assign-order-select"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Seleccionar Orden de Trabajo en Espera <span className="text-red-600">*</span>
            </label>
            {unassignedOrders.length === 0 ? (
              <p className="text-xs text-slate-600 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                No hay órdenes pendientes de asignación en este momento.
              </p>
            ) : (
              <select
                id="assign-order-select"
                value={selectedOtCode}
                onChange={(e) => setSelectedOtCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3.5 py-2.5 text-sm font-semibold min-h-[44px] focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
              >
                {unassignedOrders.map((o) => (
                  <option key={o.id} value={o.code}>
                    {o.code} - {o.vehiclePlate} ({o.vehicleBrand} {o.vehicleModel}) - {o.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="assign-primary-mechanic"
                className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                Mecánico Principal <span className="text-red-600">*</span>
              </label>
              <select
                id="assign-primary-mechanic"
                value={selectedPrimaryMechanic}
                onChange={(e) => setSelectedPrimaryMechanic(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3.5 py-2.5 text-sm min-h-[44px] focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.specialty})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="assign-assistant-mechanic"
                className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
              >
                Ayudante Técnico (Opcional)
              </label>
              <select
                id="assign-assistant-mechanic"
                value={selectedAssistantMechanic}
                onChange={(e) => setSelectedAssistantMechanic(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3.5 py-2.5 text-sm min-h-[44px] focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
              >
                <option value="">Sin ayudante adicional</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
            <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={() => setSelectedBayForAssign(null)}>
              Cancelar
            </Button>
            <Button variant="primary" isLoading={isAssigning} disabled={unassignedOrders.length === 0} onClick={handleConfirmAssignment}>
              Confirmar Asignación de Bahía
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        variant="light"
        isOpen={!!bayToEditStatus}
        onClose={() => setBayToEditStatus(null)}
        title={`Cambiar Estado de ${bayToEditStatus?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nuevo Estado Operativo:</label>
            <select
              value={newBayStatus}
              onChange={(e) => setNewBayStatus(e.target.value as BayStatus)}
              className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3.5 py-2.5 text-sm min-h-[44px] focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
            >
              <option value="LIBRE">Libre (Disponible para recibir vehículos)</option>
              <option value="OCUPADA">Ocupada (Vehículo en elevador/fosa)</option>
              <option value="ESPERA_REPUESTO">En Espera de Repuesto (Trabajo en pausa)</option>
              <option value="MANTENIMIENTO">En Mantenimiento de Equipamiento Taller</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
            <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={() => setBayToEditStatus(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdateBayStatus}>
              Guardar Estado
            </Button>
          </div>
        </div>
      </Modal>

      {diagnosingOrder && (
        <DiagnosticFormModal
          order={diagnosingOrder}
          mechanics={mechanics}
          inventory={inventory}
          isOpen={!!diagnosingOrder}
          changedBy="Jefe de Taller (Ing. Sergio Fratelli)"
          onClose={() => setDiagnosingOrder(null)}
          onSaveDraft={(payload) => {
            try {
              saveDiagnosticDraft(diagnosingOrder.id, payload, 'Jefe de Taller (Ing. Sergio Fratelli)');
              toast.success('Borrador guardado', `${diagnosingOrder.code} en estado "En Diagnóstico".`);
              setDiagnosingOrder(null);
              refresh();
            } catch (err) {
              toast.danger('No se pudo guardar', err instanceof Error ? err.message : 'Error');
            }
          }}
          onComplete={(payload) => {
            try {
              completeDiagnostic(diagnosingOrder.id, payload, 'Jefe de Taller (Ing. Sergio Fratelli)');
              toast.success('Diagnóstico Completado', `${diagnosingOrder.code} pasó a estado "Diagnóstico Completado".`);
              setDiagnosingOrder(null);
              refresh();
            } catch (err) {
              toast.danger('No se pudo completar', err instanceof Error ? err.message : 'Error');
            }
          }}
        />
      )}

      {pendingDiagnosis.length > 0 && (
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-slate-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong className="text-sky-700">{pendingDiagnosis.length} OT(s)</strong> en espera de diagnóstico técnico inicial. Use
            "Registrar Diagnóstico".
          </span>
          {pendingDiagnosis.length > 0 && (
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
          )}
        </div>
      )}
    </div>
  );
}
