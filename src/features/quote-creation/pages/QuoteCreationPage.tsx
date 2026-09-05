import { useEffect, useMemo, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FileCheck, Hammer, Package, Plus, Send, Trash2, User, Wrench } from 'lucide-react';

import { useToast } from '../../../shared/components/ToastContext';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ErrorState } from '../../../shared/components/ErrorState';
import {
  usePendingQuoteOrders,
  useDiagnostic,
  useSparePartsCatalog,
  useCreateQuote,
  type QuoteItemType,
  type QuoteResponse,
} from '../api/useQuoteCreation';
import { quoteFormSchema, type QuoteFormValues, type QuoteItemInput } from '../schemas/quote-schema';
import { QuoteSummary } from '../components/QuoteSummary';

interface DraftItem {
  key: string;
  type: QuoteItemType;
  description: string;
  sparePartId?: string;
  quantity: number;
  unitPrice?: number;
}

const money = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(amount: number): string {
  return `${money.format(amount)} BOB`;
}

function toPayloadItems(items: DraftItem[]): QuoteItemInput[] {
  return items.map((item) => ({
    description: item.description,
    itemType: item.type,
    quantity: item.quantity,
    ...(item.type === 'PART' && item.sparePartId ? { sparePartId: item.sparePartId } : {}),
  })) as QuoteItemInput[];
}

type ItemFieldError = {
  description?: { message?: string };
  quantity?: { message?: string };
  sparePartId?: { message?: string };
};

function getItemsErrorMessage(errors: FieldErrors<QuoteFormValues>): string | null {
  const items = errors.items as (Array<ItemFieldError | undefined> & { root?: { message?: string } }) | undefined;
  if (!items) return null;
  if (items.root?.message) return items.root.message;
  const first = items[0];
  if (!first) return null;
  return first.description?.message ?? first.quantity?.message ?? first.sparePartId?.message ?? null;
}

function QuoteCreationIndex({ onSelect }: { onSelect: (orderId: string) => void }) {
  const listQuery = usePendingQuoteOrders();

  if (listQuery.isLoading) return <LoadingSpinner message="Cargando órdenes pendientes de presupuestar..." />;
  if (listQuery.isError) {
    return (
      <ErrorState
        message={listQuery.error instanceof Error ? listQuery.error.message : 'No se pudieron cargar las órdenes.'}
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  const orders = listQuery.data?.data ?? [];

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-lime-950">
          <FileCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-lime-700">GESTIÓN DE TALLER</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Elaboración de Presupuestos</h1>
        </div>
      </div>
      <p className="max-w-2xl text-sm text-slate-600">
        Selecciona una orden de trabajo en diagnóstico para leer las tareas y repuestos sugeridos y crear su presupuesto (HU-12).
      </p>

      {orders.length === 0 ? (
        <Card variant="public" className="text-center">
          <FileCheck className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 font-bold text-slate-900">No hay órdenes pendientes de presupuestar</h2>
          <p className="mt-1 text-sm text-slate-500">Las órdenes en estado EN_DIAGNOSTICO aparecerán aquí.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order) => (
            <Card key={order.id} variant="public" className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-mono text-lg font-extrabold text-slate-900">{order.plate}</h2>
                    <p className="text-sm text-slate-500">{order.brand} {order.model} ({order.year})</p>
                  </div>
                  <Badge variant="warning">{order.status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <User className="h-3.5 w-3.5" /> {order.customerName}
                </div>
                {order.initialComplaint && (
                  <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                    <strong>Motivo:</strong> {order.initialComplaint}
                  </p>
                )}
              </div>
              <Button variant="primary" className="w-full" rightIcon={<Wrench className="h-4 w-4" />} onClick={() => onSelect(order.id)}>
                Elaborar presupuesto
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface QuoteCreationFormProps {
  orderId: string;
  onBack: () => void;
  onCreated: (quote: QuoteResponse) => void;
}

function QuoteCreationForm({ orderId, onBack, onCreated }: QuoteCreationFormProps) {
  const toast = useToast();
  const { data: orderList } = usePendingQuoteOrders();
  const order = orderList?.data?.find((o) => o.id === orderId);
  const diagnosticQuery = useDiagnostic(orderId);
  const catalogQuery = useSparePartsCatalog();
  const createQuoteMutation = useCreateQuote(orderId);

  const [laborHours, setLaborHours] = useState<number>(0);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQuantity, setSelectedPartQuantity] = useState<number>(1);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: { items: [] },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  useEffect(() => {
    setValue('items', toPayloadItems(draftItems), { shouldValidate: false });
  }, [draftItems, setValue]);

  const catalog = catalogQuery.data?.data ?? [];
  const selectedPart = selectedPartId ? catalog.find((p) => p.id === selectedPartId) : undefined;

  const total = useMemo(() => {
    return draftItems.reduce((sum, item) => {
      const price = item.type === 'LABOR' ? (item.unitPrice ?? 0) : Number(item.unitPrice ?? 0);
      return sum + price * item.quantity;
    }, 0);
  }, [draftItems]);

  const itemsErrorMessage = getItemsErrorMessage(errors);

  const addLaborItem = () => {
    if (laborHours <= 0) {
      toast.warning('Ingresa una cantidad de horas mayor a 0.');
      return;
    }
    let index = draftItems.length + 1;
    while (draftItems.some((d) => d.key === `LABOR-${index}`)) index += 1;
    setDraftItems((current) => [
      ...current,
      { key: `LABOR-${index}`, type: 'LABOR', description: 'Mano de obra', quantity: laborHours },
    ]);
    setLaborHours(0);
  };

  const addPartItem = () => {
    if (!selectedPart) {
      toast.warning('Selecciona un repuesto del catálogo.');
      return;
    }
    if (!Number.isInteger(selectedPartQuantity) || selectedPartQuantity <= 0) {
      toast.warning('La cantidad debe ser un entero mayor a 0.');
      return;
    }
    let index = draftItems.length + 1;
    while (draftItems.some((d) => d.key === `PART-${index}`)) index += 1;
    setDraftItems((current) => [
      ...current,
      {
        key: `PART-${index}`,
        type: 'PART',
        description: selectedPart.name,
        sparePartId: selectedPart.id,
        quantity: selectedPartQuantity,
        unitPrice: Number(selectedPart.unitPrice),
      },
    ]);
    setSelectedPartId('');
    setSelectedPartQuantity(1);
  };

  const removeItem = (key: string) => {
    setDraftItems((current) => current.filter((item) => item.key !== key));
  };

  const onSubmitValid = async (values: QuoteFormValues) => {
    try {
      const result = await createQuoteMutation.mutateAsync(values.items);
      toast.success(
        'Presupuesto creado',
        `Presupuesto ${result.data.id} por ${formatMoney(Number(result.data.total))}.`,
      );
      onCreated(result.data);
    } catch (error) {
      toast.danger('No se pudo crear el presupuesto', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  };

  const onSubmitInvalid = (invalidValues: FieldErrors<QuoteFormValues>) => {
    if (draftItems.length === 0) {
      toast.warning('Agrega al menos un ítem (mano de obra o repuesto).');
      return;
    }
    toast.warning('Revisa los ítems del presupuesto', getItemsErrorMessage(invalidValues) ?? undefined);
  };

  const submitForm = handleSubmit((values) => void onSubmitValid(values), onSubmitInvalid);

  if (diagnosticQuery.isLoading || catalogQuery.isLoading) {
    return <LoadingSpinner message="Cargando diagnóstico y catálogo..." />;
  }
  if (diagnosticQuery.isError) {
    return <ErrorState message="No se pudo cargar el diagnóstico de la orden." onRetry={() => void diagnosticQuery.refetch()} />;
  }
  if (!order) {
    return <ErrorState message="No se encontró la orden de trabajo." onRetry={() => void diagnosticQuery.refetch()} />;
  }

  const diagnostic = diagnosticQuery.data?.data;
  const hasDiagnostic = Boolean(diagnostic?.description || diagnostic?.suggestedTasks?.length);

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-200 hover:text-slate-950" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Volver
        </Button>
        <div className="h-6 w-px bg-slate-300" />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Elaborar Presupuesto</h1>
          <p className="text-sm text-slate-500">{order.plate} · {order.brand} {order.model} · {order.customerName}</p>
        </div>
      </div>

      <Card variant="public" padding="lg">
        <h2 className="mb-2 flex items-center gap-2 font-extrabold text-slate-900">
          <Hammer className="h-5 w-5 text-lime-700" /> Diagnóstico de la OT
        </h2>
        {!hasDiagnostic ? (
          <p className="text-sm text-slate-500">Esta orden no registra diagnóstico todavía.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {diagnostic?.description && <p className="text-slate-700">{diagnostic.description}</p>}
            {(diagnostic?.suggestedTasks?.length ?? 0) > 0 && (
              <div>
                <strong className="text-slate-700">Tareas sugeridas:</strong>
                <ul className="mt-1 list-disc pl-5 text-slate-600">
                  {(diagnostic?.suggestedTasks ?? []).map((task, i) => <li key={i}>{task}</li>)}
                </ul>
              </div>
            )}
            {typeof diagnostic?.estimatedHours === 'number' && (
              <p className="text-xs text-slate-500">Horas estimadas: <strong>{diagnostic.estimatedHours}</strong></p>
            )}
          </div>
        )}
      </Card>

      <Card variant="public" padding="lg">
        <h2 className="mb-4 font-extrabold text-slate-900">Construcción del presupuesto</h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Wrench className="h-4 w-4 text-lime-700" /> Mano de obra (LABOR)
            </h3>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Horas</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={laborHours}
                  onChange={(e) => setLaborHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                  placeholder="Ej: 2.5"
                />
              </div>
              <Button variant="outline" onClick={addLaborItem} leftIcon={<Plus className="h-4 w-4" />}>Agregar</Button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Package className="h-4 w-4 text-lime-700" /> Repuesto del catálogo (PART)
            </h3>
            {catalog.length === 0 ? (
              <p className="text-sm text-slate-500">No hay repuestos disponibles en el catálogo.</p>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Repuesto</label>
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                  >
                    <option value="">Selecciona un repuesto</option>
                    {catalog.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.code} — {part.name} ({part.availableStock} disp.)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Cant.</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={selectedPartQuantity}
                    onChange={(e) => setSelectedPartQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>
                <Button variant="outline" onClick={addPartItem} leftIcon={<Plus className="h-4 w-4" />}>Agregar</Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-slate-700">Ítems del presupuesto</h3>
          {draftItems.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no has agregado ítems.</p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {draftItems.map((item) => {
                const price = item.type === 'LABOR' ? (item.unitPrice ?? 0) : Number(item.unitPrice ?? 0);
                return (
                  <div key={item.key} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <Badge variant={item.type === 'LABOR' ? 'info' : 'success'}>
                        {item.type === 'LABOR' ? 'ManodeObra' : 'Repuesto'}
                      </Badge>
                      <p className="mt-1 text-sm font-medium text-slate-700">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-extrabold text-slate-900">
                        {formatMoney(price * item.quantity)}
                      </p>
                      <p className="text-xs text-slate-500">× {item.quantity}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.key)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {itemsErrorMessage && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
              {itemsErrorMessage}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Total: <strong className="font-mono text-lg text-lime-700">{formatMoney(total)}</strong>
            <span className="ml-1 text-xs">(los precios finales los calcula el backend con tarifas oficiales)</span>
          </p>
          <Button
            variant="primary"
            size="lg"
            disabled={draftItems.length === 0 || createQuoteMutation.isPending || isSubmitting}
            onClick={() => void submitForm()}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Enviar presupuesto
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function QuoteCreationPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [createdQuote, setCreatedQuote] = useState<QuoteResponse | null>(null);

  if (createdQuote) {
    return (
      <QuoteSummary
        quote={createdQuote}
        onDone={() => {
          setCreatedQuote(null);
          setOrderId(null);
        }}
      />
    );
  }

  return orderId ? (
    <QuoteCreationForm orderId={orderId} onBack={() => setOrderId(null)} onCreated={setCreatedQuote} />
  ) : (
    <QuoteCreationIndex onSelect={setOrderId} />
  );
}