import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, FileCheck, RefreshCw, User, WalletCards, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { useToast } from '../../../shared/components/ToastContext';
import {
  useBudgetApproval,
  useBudgetApprovalList,
  useSubmitBudgetApproval,
} from '../api/useBudgetApproval';
import type { BudgetDecision } from '../api/useBudgetApproval';
import { ApprovalSummaryModal, type DecisionFormValues } from '../components/ApprovalSummaryModal';
import { BudgetItemsTable } from '../components/BudgetItemsTable';
import { EVWarningBanner } from '../components/EVWarningBanner';

const TAX_RATE = 0.13;
const moneyFormatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} BOB`;
}

function BudgetApprovalIndex() {
  const navigate = useNavigate();
  const listQuery = useBudgetApprovalList();

  if (listQuery.isLoading) return <LoadingSpinner message="Cargando presupuestos pendientes..." />;
  if (listQuery.isError) return <ErrorState message={listQuery.error instanceof Error ? listQuery.error.message : 'No se pudo cargar la lista de presupuestos.'} onRetry={() => void listQuery.refetch()} />;
  const budgets = listQuery.data ?? [];

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-lime-950"><FileCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-lime-700">GESTIÓN DE TALLER</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Aprobación de presupuestos</h1>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Selecciona una orden de trabajo para revisar y aprobar repuestos y servicios por separado.</p>
      </div>

      {budgets.length === 0 ? (
        <Card variant="public" className="text-center">
          <FileCheck className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 font-bold text-slate-900">No hay presupuestos para revisar</h2>
          <p className="mt-1 text-sm text-slate-500">Las órdenes presupuestadas aparecerán aquí.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((item) => (
            <Card key={item.orderId} variant="public" className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-lime-700">{item.orderCode}</span>
                    <h2 className="mt-1 font-extrabold text-slate-900">{item.vehiclePlate}</h2>
                    <p className="text-sm text-slate-500">{item.vehicleDescription}</p>
                  </div>
                  <Badge variant={item.status === 'APROBADO' ? 'success' : item.status === 'RECHAZADO' ? 'danger' : 'warning'}>{item.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500"><User className="h-3.5 w-3.5" /> {item.clientName}</span>
                  <strong className="font-mono text-slate-900">{formatMoney(item.totalBOB)}</strong>
                </div>
              </div>
              <Button variant="primary" onClick={() => navigate(`/presupuestos/${item.orderId}`)} rightIcon={<ChevronRight className="h-4 w-4" />}>Revisar presupuesto</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function BudgetApprovalPage() {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const approvalQuery = useBudgetApproval(orderId);
  const submitApproval = useSubmitBudgetApproval(orderId ?? '');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [decision, setDecision] = useState<BudgetDecision>('APROBADO');

  useEffect(() => {
    if (approvalQuery.data) {
      setSelectedItemIds(approvalQuery.data.items.filter((item) => item.isApproved && !item.isElectricRestricted).map((item) => item.id));
    }
  }, [approvalQuery.data]);

  if (!orderId) return <BudgetApprovalIndex />;
  if (approvalQuery.isLoading) return <LoadingSpinner message="Cargando OT y presupuesto..." />;
  if (approvalQuery.isError || !approvalQuery.data) {
    return <ErrorState message={approvalQuery.error instanceof Error ? approvalQuery.error.message : 'No se pudo cargar la orden de trabajo.'} onRetry={() => void approvalQuery.refetch()} />;
  }

  const { workOrder, budget, items, isFullyElectric } = approvalQuery.data;
  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
  const subtotalBOB = selectedItems.reduce((sum, item) => sum + item.totalBOB, 0);
  const discountBOB = Math.min(budget.discountBOB, subtotalBOB);
  const taxBOB = Math.max(0, subtotalBOB - discountBOB) * TAX_RATE;
  const totalBOB = Math.max(0, subtotalBOB - discountBOB + taxBOB);
  const blockedItemCount = items.filter((item) => item.isElectricRestricted).length;
  const hasSelection = selectedItemIds.length > 0;
  const canRegisterDecision = workOrder.status === 'PRESUPUESTO_ENVIADO' && !['APROBADO', 'RECHAZADO'].includes(budget.status);

  const toggleItem = (itemId: string) => {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item || item.isElectricRestricted) return;
    setSelectedItemIds((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  };

  const toggleAll = () => {
    const selectableIds = items.filter((item) => !item.isElectricRestricted).map((item) => item.id);
    setSelectedItemIds((current) => selectableIds.every((id) => current.includes(id)) ? [] : selectableIds);
  };

  const handleConfirmDecision = async (values: DecisionFormValues) => {
    const isApproval = values.decision === 'APROBADO';
    try {
      await submitApproval.mutateAsync({
        approvedItemIds: isApproval ? selectedItemIds : [],
        rejectedItemIds: isApproval ? items.filter((item) => !selectedItemIds.includes(item.id)).map((item) => item.id) : items.map((item) => item.id),
        decision: values.decision,
        channel: values.channel,
        customerName: workOrder.clientName,
        notes: values.notes.trim(),
        rejectionReason: values.rejectionReason?.trim() || undefined,
      });
      setIsSummaryOpen(false);
      toast.success(
        isApproval ? 'Aprobación registrada' : 'Rechazo registrado',
        `La OT ${workOrder.code} fue actualizada correctamente.`,
      );
    } catch (error) {
      toast.danger('No se pudo registrar la decisión', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-200 hover:text-slate-950" onClick={() => navigate('/presupuestos')} leftIcon={<ArrowLeft className="h-4 w-4" />}>Presupuestos</Button>
          <div className="hidden h-6 w-px bg-slate-300 sm:block" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Aprobación de OT</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={() => void approvalQuery.refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>Actualizar</Button>
      </div>

      <Card variant="public" padding="lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-lime-100 px-2.5 py-1 font-mono text-xs font-extrabold text-lime-800">{workOrder.code}</span>
              <Badge variant={budget.status === 'APROBADO' ? 'success' : budget.status === 'RECHAZADO' ? 'danger' : 'warning'}>{budget.status}</Badge>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{workOrder.vehiclePlate}</h2>
            <p className="mt-1 text-sm text-slate-500">{workOrder.vehicleBrand} {workOrder.vehicleModel} ({workOrder.vehicleYear})</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span><strong className="text-slate-700">Cliente:</strong> {workOrder.clientName}</span><span><strong className="text-slate-700">Documento:</strong> {workOrder.clientDocument}</span></div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 lg:min-w-56 lg:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total seleccionado</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-lime-700">{formatMoney(totalBOB)}</p>
            <p className="mt-1 text-xs text-slate-500">{selectedItems.length} de {items.length} ítems</p>
          </div>
        </div>
      </Card>

      <EVWarningBanner isFullyElectric={isFullyElectric} blockedItemCount={blockedItemCount} />

      <BudgetItemsTable items={items} selectedItemIds={selectedItemIds} onToggleItem={toggleItem} onToggleAll={toggleAll} />

      <Card variant="public" padding="lg">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2"><WalletCards className="h-5 w-5 text-lime-700" /><h2 className="font-extrabold text-slate-900">Resumen en tiempo real</h2></div>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">Subtotal</span><strong className="font-mono text-slate-900">{formatMoney(subtotalBOB)}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="block text-xs text-slate-500">IVA 13%</span><strong className="font-mono text-slate-900">{formatMoney(taxBOB)}</strong></div>
              <div className="rounded-xl bg-emerald-50 p-3"><span className="block text-xs text-emerald-700">Descuento</span><strong className="font-mono text-emerald-800">-{formatMoney(discountBOB)}</strong></div>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row lg:flex-col">
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button
                variant="primary"
                size="lg"
                disabled={!hasSelection || !canRegisterDecision}
                onClick={() => {
                  setDecision('APROBADO');
                  setIsSummaryOpen(true);
                }}
                leftIcon={<CheckCircle2 className="h-5 w-5" />}
              >
                Revisar y aprobar
              </Button>
              <Button
                variant="danger"
                size="lg"
                disabled={!canRegisterDecision}
                onClick={() => {
                  setDecision('RECHAZADO');
                  setIsSummaryOpen(true);
                }}
                leftIcon={<XCircle className="h-5 w-5" />}
              >
                Rechazar presupuesto
              </Button>
            </div>
            <p className="text-center text-[11px] text-slate-500">
              {canRegisterDecision ? 'Los ítems bloqueados por RN-18 no pueden aprobarse.' : 'Esta OT ya tiene una decisión registrada.'}
            </p>
          </div>
        </div>
      </Card>

      <ApprovalSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onConfirm={(values) => void handleConfirmDecision(values)}
        items={items}
        approvedItemIds={selectedItemIds}
        subtotalBOB={subtotalBOB}
        taxBOB={taxBOB}
        discountBOB={discountBOB}
        totalBOB={totalBOB}
        isSubmitting={submitApproval.isPending}
        decision={decision}
      />
    </div>
  );
}
