import { useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, FileCheck, RefreshCw, User, WalletCards, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { ApiError } from '../../../shared/api/httpClient';
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
import type { BudgetApprovalListItem, BudgetDecision, BudgetDecisionPayload } from '../api/useBudgetApproval';
import { ApprovalSummaryModal, type DecisionFormValues } from '../components/ApprovalSummaryModal';
import { BudgetItemsTable } from '../components/BudgetItemsTable';
import { EVWarningBanner } from '../components/EVWarningBanner';
import { cleanServerMessage } from '../../../shared/lib/utils';

const moneyFormatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(amount: string | number): string {
  return `${moneyFormatter.format(Number(amount))} BOB`;
}

function orderReference(orderId: string): string {
  return `OT · ${orderId.slice(0, 8).toUpperCase()}`;
}

function statusBadgeVariant(status: string): 'success' | 'danger' | 'warning' {
  if (status === 'APROBADO') return 'success';
  if (status === 'RECHAZADO') return 'danger';
  return 'warning';
}

function BudgetApprovalIndex() {
  const navigate = useNavigate();
  const listQuery = useBudgetApprovalList();

  if (listQuery.isLoading) return <LoadingSpinner message="Cargando presupuestos pendientes..." />;
  if (listQuery.isError) return <ErrorState message={listQuery.error instanceof Error ? listQuery.error.message : 'No se pudo cargar la lista de presupuestos.'} onRetry={() => void listQuery.refetch()} />;
  const budgets: BudgetApprovalListItem[] = listQuery.data ?? [];

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
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Revisa el presupuesto enviado al cliente y registra su aprobación o rechazo del presupuesto completo.</p>
      </div>

      {budgets.length === 0 ? (
        <Card variant="public" className="text-center">
          <FileCheck className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 font-bold text-slate-900">No hay presupuestos pendientes</h2>
          <p className="mt-1 text-sm text-slate-500">Las órdenes que esperan la decisión del cliente aparecerán aquí.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((item) => (
            <Card key={item.orderId} variant="public" className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-lime-700">{orderReference(item.orderId)}</span>
                    <h2 className="mt-1 font-extrabold text-slate-900">{item.vehiclePlate}</h2>
                    <p className="text-sm text-slate-500">{item.vehicleDescription}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
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
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [decision, setDecision] = useState<BudgetDecision>('APPROVED');

  if (!orderId) return <BudgetApprovalIndex />;
  if (approvalQuery.isLoading) return <LoadingSpinner message="Cargando OT y presupuesto..." />;
  if (approvalQuery.isError || !approvalQuery.data) {
    return <ErrorState message={approvalQuery.error instanceof Error ? approvalQuery.error.message : 'No se pudo cargar la orden de trabajo.'} onRetry={() => void approvalQuery.refetch()} />;
  }

  const { workOrder, budget, items, isFullyElectric } = approvalQuery.data;
  const canRegisterDecision = workOrder.status === 'PRESUPUESTO_ENVIADO';

  const handleConfirmDecision = async (values: DecisionFormValues) => {
    const isApproval = values.decision === 'APPROVED';
    const payload: BudgetDecisionPayload = {
      decision: values.decision,
      channel: values.channel,
      customerName: workOrder.clientName,
      notes: values.notes.trim(),
      reason: values.decision === 'REJECTED' ? values.reason?.trim() || undefined : undefined,
    };
    try {
      await submitApproval.mutateAsync(payload);
      setIsSummaryOpen(false);
      toast.success(
        isApproval ? 'Aprobación registrada' : 'Rechazo registrado',
        isApproval
          ? `El presupuesto de ${workOrder.vehiclePlate} fue aprobado y los repuestos quedaron reservados.`
          : `El presupuesto de ${workOrder.vehiclePlate} fue rechazado por el cliente.`,
      );
      navigate('/presupuestos', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 409)) {
        toast.warning('Decisión ya registrada', 'Esta OT ya no está pendiente de aprobación.');
        navigate('/presupuestos', { replace: true });
        return;
      }
      toast.danger('No se pudo registrar la decisión', cleanServerMessage(error instanceof Error ? error.message : '') || 'Intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost-light" size="sm" onClick={() => navigate('/presupuestos')} leftIcon={<ArrowLeft className="h-4 w-4" />}>Presupuestos</Button>
          <div className="hidden h-6 w-px bg-slate-300 sm:block" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Aprobación de OT</h1>
          </div>
        </div>
        <Button variant="outline-light" size="sm" onClick={() => void approvalQuery.refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>Actualizar</Button>
      </div>

      <Card variant="public" padding="lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-lime-100 px-2.5 py-1 font-mono text-xs font-extrabold text-lime-800">{orderReference(workOrder.id)}</span>
              <Badge variant={statusBadgeVariant(workOrder.status)}>{workOrder.status}</Badge>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{workOrder.vehiclePlate}</h2>
            <p className="mt-1 text-sm text-slate-500">{workOrder.vehicleBrand} {workOrder.vehicleModel} ({workOrder.vehicleYear})</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span><strong className="text-slate-700">Cliente:</strong> {workOrder.clientName}</span><span><strong className="text-slate-700">Documento:</strong> {workOrder.clientDocument}</span><span><strong className="text-slate-700">Motivo:</strong> {workOrder.entryReason}</span></div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 lg:min-w-56 lg:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total del presupuesto</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-lime-700">{formatMoney(budget.total)}</p>
            <p className="mt-1 text-xs text-slate-500">Mano de obra {formatMoney(budget.laborSubtotal)} · Repuestos {formatMoney(budget.partsSubtotal)}</p>
          </div>
        </div>
      </Card>

      {isFullyElectric && <EVWarningBanner isFullyElectric={isFullyElectric} />}

      <BudgetItemsTable items={items} />

      <Card variant="public" padding="lg">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2"><WalletCards className="h-5 w-5 text-lime-700" /><h2 className="font-extrabold text-slate-900">Decisión del cliente</h2></div>
            <p className="text-sm text-slate-600">La aprobación autoriza el presupuesto completo y reserva todos los repuestos cotizados. El rechazo los libera y mantiene la OT visible hasta el retiro del vehículo.</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row lg:flex-col">
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button
                variant="primary"
                size="lg"
                disabled={!canRegisterDecision}
                onClick={() => {
                  setDecision('APPROVED');
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
                  setDecision('REJECTED');
                  setIsSummaryOpen(true);
                }}
                leftIcon={<XCircle className="h-5 w-5" />}
              >
                Rechazar presupuesto
              </Button>
            </div>
            <p className="text-center text-[11px] text-slate-500">
              {canRegisterDecision ? 'La decisión quedará registrada con tu usuario.' : 'Esta OT ya tiene una decisión registrada.'}
            </p>
          </div>
        </div>
      </Card>

      <ApprovalSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onConfirm={(values) => void handleConfirmDecision(values)}
        decision={decision}
        isSubmitting={submitApproval.isPending}
        customerName={workOrder.clientName}
        items={items}
        budget={{ laborSubtotal: budget.laborSubtotal, partsSubtotal: budget.partsSubtotal, total: budget.total, currency: budget.currency }}
      />
    </div>
  );
}