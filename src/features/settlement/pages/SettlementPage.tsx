import { ArrowLeft, Banknote, BadgePercent, Car, Package, Printer, RotateCcw, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Button } from '../../../shared/components/Button';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { MetricCard } from '../../../shared/components/MetricCard';
import { Badge, WorkOrderStatusBadge } from '../../../shared/components/Badge';
import { Modal } from '../../../shared/components/Modal';
import type { WorkOrderStatus } from '../../../shared/types/openapi';
import { useToast } from '../../../shared/components/ToastContext';

import { useAuth } from '../../auth/hooks/useAuth';
import {
  translateDeliverError,
  translateSettlementError,
  translateSettlementLoadError,
} from '../api/settlement.errors';
import {
  useApplyDiscount,
  useDeliver,
  useSettlement,
  useVoidAdjustment,
} from '../api/use-settlement';
import type { DeliverResponse, SettlementAdjustmentSummary } from '../api/settlement.types';
import { AdjustmentList } from '../components/AdjustmentList';
import { ApplyDiscountModal } from '../components/ApplyDiscountModal';
import { DeliverModal } from '../components/DeliverModal';
import { LiquidationNote } from '../components/LiquidationNote';
import { SettlementBreakdown } from '../components/SettlementBreakdown';
import { VoidAdjustmentModal } from '../components/VoidAdjustmentModal';
import { formatBoB } from '../lib/money';

export function SettlementPage() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const isWorkshopLead = user?.role === 'WORKSHOP_LEAD';
  const canDeliver = user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN';

  const settlementQuery = useSettlement(orderId);
  const applyDiscount = useApplyDiscount(orderId);
  const voidAdjustment = useVoidAdjustment(orderId);
  const deliver = useDeliver(orderId);

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [voidingAdjustment, setVoidingAdjustment] =
    useState<SettlementAdjustmentSummary | null>(null);
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [delivered, setDelivered] = useState<DeliverResponse | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // US-20 / FE-T20.2: prints only the liquidation note document.
  const handlePrintNote = () => {
    document.body.classList.add('settlement-printing');
    const afterPrint = () => {
      document.body.classList.remove('settlement-printing');
      window.removeEventListener('afterprint', afterPrint);
    };
    window.addEventListener('afterprint', afterPrint);
    window.print();
  };

  if (settlementQuery.isPending) {
    return <LoadingSkeleton rows={6} tone="light" />;
  }

  if (settlementQuery.isError || !settlementQuery.data) {
    const details = translateSettlementLoadError(settlementQuery.error);
    return (
      <div className="space-y-4">
        <ErrorState
          message={details.message}
          onRetry={() => void settlementQuery.refetch()}
        />
        <div className="flex justify-center">
          <Button variant="outline-light" onClick={() => navigate('/liquidacion')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Volver a liquidaciones
          </Button>
        </div>
      </div>
    );
  }

  const settlement = settlementQuery.data;

  const handleApplyDiscount = async (payload: { amount: number; reason: string }) => {
    try {
      await applyDiscount.mutateAsync(payload);
      setIsDiscountOpen(false);
      toast.success(
        'Descuento aplicado',
        `Se descontaron ${formatBoB(String(payload.amount.toFixed(2)))} de la liquidación.`,
      );
    } catch (error) {
      const details = translateSettlementError(error);
      toast.danger('No se pudo aplicar el descuento', details.message);
      throw error;
    }
  };

  const handleVoid = async (reason: string) => {
    if (!voidingAdjustment) return;
    try {
      await voidAdjustment.mutateAsync({ adjustmentId: voidingAdjustment.id, reason });
      setVoidingAdjustment(null);
      toast.success('Descuento anulado', 'La anulación quedó registrada en el historial.');
    } catch (error) {
      const details = translateSettlementError(error);
      toast.danger('No se pudo anular el descuento', details.message);
      throw error;
    }
  };

  const handleDeliver = async (payload: {
    paymentMethod: 'CASH' | 'QR_TRANSFER' | 'CARD';
    receiptNumber: string;
    deliveryNotes?: string;
  }) => {
    try {
      const response = await deliver.mutateAsync(payload);
      setIsDeliverOpen(false);
      setDelivered(response);
      toast.success(
        'Vehículo entregado',
        `Cuenta cobrada por ${formatBoB(response.totalCharged)} · OT en estado ENTREGADO.`,
      );
      setIsNoteOpen(true);
    } catch (error) {
      const details = translateDeliverError(error);
      toast.danger('No se pudo registrar la entrega', details.message);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline-light" onClick={() => navigate('/liquidacion')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Liquidaciones
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline-light"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => setIsNoteOpen(true)}
          >
            Imprimir Nota
          </Button>
          {isWorkshopLead && (
            <Button
              variant="primary"
              leftIcon={<BadgePercent className="h-4 w-4" />}
              onClick={() => setIsDiscountOpen(true)}
            >
              Aplicar Descuento
            </Button>
          )}
          {canDeliver && (
            <Button
              variant="primary"
              leftIcon={<Banknote className="h-4 w-4" />}
              onClick={() => setIsDeliverOpen(true)}
            >
              Entregar Vehículo
            </Button>
          )}
        </div>
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-600">
              Liquidación de cuenta
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xl font-extrabold tracking-wide text-slate-900">
                {settlement.plate}
              </span>
              {settlement.status && (
                <WorkOrderStatusBadge status={settlement.status as WorkOrderStatus} />
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <Car className="mr-1 inline h-4 w-4 text-slate-400" aria-hidden="true" />
              {settlement.brand} {settlement.model} ({settlement.year})
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left lg:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cliente</p>
            <p className="text-sm font-bold text-slate-900">{settlement.customerName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              <Badge variant="default" size="sm">{settlement.currency}</Badge>
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          theme="light"
          title="Mano de obra"
          value={formatBoB(settlement.laborSubtotal)}
          icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricCard
          theme="light"
          title="Repuestos instalados"
          value={formatBoB(settlement.partsSubtotal)}
          icon={<Package className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricCard
          theme="light"
          title="Descuentos"
          variant={Number(settlement.discountsTotal) > 0 ? 'warning' : 'default'}
          value={formatBoB(settlement.discountsTotal)}
          icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
        />
        <MetricCard
          theme="light"
          title="Total a cobrar"
          value={formatBoB(settlement.totalAfterDiscounts)}
          icon={<Banknote className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <SettlementBreakdown settlement={settlement} />

      <AdjustmentList
        adjustments={settlement.adjustments}
        canVoid={isWorkshopLead}
        onVoid={setVoidingAdjustment}
      />

      <ApplyDiscountModal
        isOpen={isDiscountOpen}
        plate={settlement.plate}
        availableTotal={settlement.totalAfterDiscounts}
        onClose={() => setIsDiscountOpen(false)}
        onSubmit={handleApplyDiscount}
        isPending={applyDiscount.isPending}
      />

      <VoidAdjustmentModal
        isOpen={Boolean(voidingAdjustment)}
        adjustment={voidingAdjustment}
        onClose={() => setVoidingAdjustment(null)}
        onSubmit={handleVoid}
        isPending={voidAdjustment.isPending}
      />

      <DeliverModal
        isOpen={isDeliverOpen}
        plate={settlement.plate}
        totalToCharge={settlement.totalAfterDiscounts}
        onClose={() => setIsDeliverOpen(false)}
        onSubmit={handleDeliver}
        isPending={deliver.isPending}
      />

      <Modal
        isOpen={isNoteOpen}
        onClose={() => {
          setIsNoteOpen(false);
          if (delivered) navigate('/liquidacion');
        }}
        title="Nota de Liquidación y Entrega"
        subtitle="Documento sin valor fiscal · comprobante interno"
        variant="light"
        maxWidth="2xl"
      >
        <LiquidationNote settlement={settlement} delivery={delivered} />
        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          {delivered ? (
            <Button variant="outline-light" onClick={() => navigate('/liquidacion')}>
              Volver a liquidaciones
            </Button>
          ) : (
            <Button variant="outline-light" onClick={() => setIsNoteOpen(false)}>
              Cerrar
            </Button>
          )}
          <Button variant="primary" leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrintNote}>
            Imprimir
          </Button>
        </div>
      </Modal>
    </div>
  );
}