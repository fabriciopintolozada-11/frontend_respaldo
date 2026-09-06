import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Package,
  Search,
  AlertTriangle,
  Boxes,
  Layers,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Trash2,
  Zap,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { Input } from '../../../shared/components/Input';
import { MetricCard } from '../../../shared/components/MetricCard';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useToast } from '../../../shared/components/ToastContext';
import { ApiError } from '../../../shared/api/httpClient';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  useCreateSparePart,
  useDeactivateSparePart,
  useRegisterAdjustment,
  useSpareParts,
} from '../api/spare-parts-service';
import {
  adjustStockSchema,
  createSparePartSchema,
  type AdjustStockFormValues,
  type CreateSparePartFormValues,
} from '../schemas/spare-part-schema';
import {
  type InventoryAdjustmentType,
  type SparePart,
  type SparePartCategory,
  CATEGORY_LABELS,
  SPARE_PART_CATEGORIES,
} from '../spare-parts.types';

const PAGE_SIZE = 20;

function formatCurrency(value?: string): string {
  if (value === undefined || value === null || value === '') {
    return 'No disponible';
  }
  return `${Number(value).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.`;
}

function daysSince(dateString?: string): string {
  if (!dateString) {
    return 'Sin movimientos';
  }
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / 86_400_000);
  if (days < 0) return 'Hoy';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  return `Hace ${days} días`;
}

function toApiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return error.message || 'Datos inválidos. Revisa que los campos cumplan el formato requerido.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El repuesto seleccionado ya no existe en el sistema.';
      case 409:
        return error.message || 'Ya existe un repuesto con ese código.';
      case 422:
        return error.message || 'El stock físico no puede quedar por debajo del stock reservado (RN-07).';
      default:
        return error.message || fallback;
    }
  }
  return fallback;
}

// FE-T23.2: stock availability badge derived exclusively from availableStock.
// No invented minimum-stock thresholds (US-23).
function availabilityBadge(
  part: SparePart,
): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (part.availableStock <= 0) return { label: 'Sin Stock', variant: 'danger' };
  if (part.reservedStock > 0) return { label: 'Parcialmente Reservado', variant: 'warning' };
  return { label: 'Disponible', variant: 'success' };
}

const inputClass =
  'w-full px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-orange-400 min-h-[44px]';

const errorClass =
  'flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700';

export function InventoryManagerView() {
  const { user } = useAuth();
  const toast = useToast();

  const canManage = user?.role === 'WORKSHOP_LEAD' || user?.role === 'ADMIN';
  // RN-16 / FE-T23.4: never render price rows to MECHANIC users.
  const canSeePrices = user?.role !== 'MECHANIC';

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SparePartCategory | 'ALL'>('ALL');
  const [onlyOutOfStock, setOnlyOutOfStock] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // US-23: any search or category change restarts pagination at page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedTerm, categoryFilter]);

  const { data, isPending, isError, refetch } = useSpareParts({
    search: debouncedTerm || undefined,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const createMutation = useCreateSparePart();
  const adjustMutation = useRegisterAdjustment();
  const deactivateMutation = useDeactivateSparePart();

  const items: SparePart[] = data?.data ?? [];
  const total = data?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / (data?.pageSize ?? PAGE_SIZE)));
  const totalAvailable = items.reduce((sum, part) => sum + part.availableStock, 0);
  const totalReserved = items.reduce((sum, part) => sum + part.reservedStock, 0);
  const outOfStockCount = items.filter((part) => part.availableStock <= 0).length;
  const latestMovement = items.reduce<string | undefined>((latest, part) => {
    if (!part.lastMovementAt) return latest;
    return latest === undefined || part.lastMovementAt > latest ? part.lastMovementAt : latest;
  }, undefined);

  const [adjustmentTarget, setAdjustmentTarget] = useState<SparePart | null>(null);
  const [adjType, setAdjType] = useState<InventoryAdjustmentType>('POSITIVE');
  const [adjError, setAdjError] = useState<string | null>(null);
  const adjustForm = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { quantity: 1, reason: '' },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createForm = useForm<CreateSparePartFormValues>({
    resolver: zodResolver(createSparePartSchema),
    defaultValues: { code: '', name: '', category: 'MOTOR', unitPrice: 0, initialStock: 0 },
  });

  const [deactivateTarget, setDeactivateTarget] = useState<SparePart | null>(null);

  const openAdjustment = (part: SparePart) => {
    setAdjType('POSITIVE');
    setAdjError(null);
    adjustForm.reset({ quantity: 1, reason: '' });
    setAdjustmentTarget(part);
  };

  const openCreate = () => {
    setCreateError(null);
    createForm.reset({ code: '', name: '', category: 'MOTOR', unitPrice: 0, initialStock: 0 });
    setShowCreate(true);
  };

  const onSubmitAdjustment = adjustForm.handleSubmit((values) => {
    if (!adjustmentTarget) return;
    setAdjError(null);
    adjustMutation.mutate(
      { sparePartId: adjustmentTarget.id, quantity: values.quantity, type: adjType, reason: values.reason },
      {
        onSuccess: (response) => {
          toast.success(
            'Ajuste Registrado',
            `${adjustmentTarget.name}: stock físico actualizado a ${response.physicalStock} unidades.`,
          );
          setAdjustmentTarget(null);
          adjustForm.reset();
        },
        onError: (error) => {
          setAdjError(toApiMessage(error, 'No se pudo registrar el ajuste de stock.'));
        },
      },
    );
  });

  const onSubmitCreate = createForm.handleSubmit((values) => {
    setCreateError(null);
    createMutation.mutate(
      {
        code: values.code,
        name: values.name,
        category: values.category,
        unitPrice: values.unitPrice,
        initialStock: values.initialStock,
      },
      {
        onSuccess: () => {
          toast.success('Repuesto Creado', `El repuesto "${values.name}" se agregó al catálogo.`);
          setShowCreate(false);
          createForm.reset();
        },
        onError: (error) => {
          setCreateError(toApiMessage(error, 'No se pudo crear el repuesto.'));
        },
      },
    );
  });

  const handleConfirmDeactivate = () => {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    deactivateMutation.mutate(target.id, {
      onSuccess: () => {
        toast.success('Repuesto Desactivado', `${target.name} ya no estará disponible en el catálogo.`);
        setDeactivateTarget(null);
      },
      onError: (error) => {
        toast.danger('Error', toApiMessage(error, 'No se pudo desactivar el repuesto.'));
        setDeactivateTarget(null);
      },
    });
  };

  const visibleItems = onlyOutOfStock ? items.filter((part) => part.availableStock <= 0) : items;

  if (isPending) {
    return <LoadingSkeleton rows={6} tone="light" />;
  }

  if (isError) {
    return (
      <EmptyState
        tone="light"
        icon={<AlertTriangle className="w-8 h-8 text-red-600" />}
        title="No se pudo conectar con el catálogo"
        description="Verifica la conexión con el backend y vuelve a intentar la consulta de repuestos."
        actionLabel="Reintentar"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Catálogo de Repuestos</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Stock físico, disponible y reservado. Los ajustes de inventario se registran con trazabilidad (US-14).
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={openCreate}
          >
            Nuevo Repuesto
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ítems en Catálogo"
          value={total}
          subtitle={`${totalAvailable} unidades disponibles en taller`}
          icon={<Boxes className="w-5 h-5" />}
          theme="light"
        />
        <MetricCard
          title="Unidades Reservadas"
          value={totalReserved}
          subtitle="Bloqueadas para OTs (RN-07)"
          icon={<Layers className="w-5 h-5" />}
          theme="light"
        />
        <MetricCard
          title="Sin Stock"
          value={outOfStockCount}
          variant={outOfStockCount > 0 ? 'warning' : 'default'}
          subtitle="Disponible en 0"
          icon={<AlertTriangle className="w-5 h-5" />}
          theme="light"
        />
        <MetricCard
          title="Última Rotación"
          value={latestMovement ? daysSince(latestMovement) : 'N/D'}
          subtitle="Según último movimiento"
          icon={<Zap className="w-5 h-5" />}
          theme="light"
        />
      </div>

      <Card variant="public" padding="md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex-1">
            <Input
              tone="light"
              leftIcon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ej: REP-MOT-001) o nombre..."
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setOnlyOutOfStock(!onlyOutOfStock)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[44px] flex items-center gap-2 ${
                onlyOutOfStock
                  ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-sm shadow-lime-950/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Ver Solo Sin Stock</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Refrescar
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border min-h-[36px] whitespace-nowrap transition-all ${
              categoryFilter === 'ALL'
                ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-sm shadow-lime-950/10'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
          {SPARE_PART_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border min-h-[36px] whitespace-nowrap transition-all ${
                categoryFilter === category
                  ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-sm shadow-lime-950/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </Card>

      {visibleItems.length === 0 ? (
        <EmptyState
          tone="light"
          icon={<Package className="w-8 h-8" />}
          title="No se encontraron repuestos"
          description="Ajusta la búsqueda, el filtro de categoría o el filtro de stock para encontrar resultados."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleItems.map((part) => {
              const isOutOfStock = part.availableStock <= 0;
              const availability = availabilityBadge(part);
              return (
                <div
                  key={part.id}
                  className={`rounded-2xl bg-white border p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                    isOutOfStock ? 'border-red-300' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-lime-800 bg-lime-50 px-2 py-0.5 rounded border border-lime-200">
                            {part.code}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {CATEGORY_LABELS[part.category]}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-950 mt-1.5 line-clamp-1">{part.name}</h3>
                      </div>
                      <Badge variant={availability.variant} dot>
                        {availability.label}
                      </Badge>
                    </div>

                    <div className="py-2.5 space-y-2.5 text-xs">
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Físico</span>
                          <span className="text-base font-extrabold text-slate-900">{part.physicalStock}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Disponible</span>
                          <span className={`text-base font-extrabold ${isOutOfStock ? 'text-red-600' : 'text-emerald-600'}`}>
                            {part.availableStock}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Reservado</span>
                          <span className="text-base font-extrabold text-lime-700">{part.reservedStock}</span>
                        </div>
                      </div>

                      {canSeePrices && (
                        <div className="flex items-center justify-between font-semibold pt-1">
                          <span className="text-slate-500">Precio oficial (BOB)</span>
                          <span className="text-sm font-mono font-extrabold text-slate-900">{formatCurrency(part.unitPrice)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between font-semibold pt-1">
                        <span className="text-slate-500">Último movimiento</span>
                        <span className="text-sm font-medium text-slate-900">{daysSince(part.lastMovementAt)}</span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<MinusCircle className="w-4 h-4" />}
                        onClick={() => openAdjustment(part)}
                        className="flex-1"
                      >
                        Ajustar Stock
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => setDeactivateTarget(part)}
                        title="Desactivar repuesto"
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 flex justify-center"
                      >
                        Desactivar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs font-semibold text-slate-600">
              {total} {total === 1 ? 'repuesto' : 'repuestos'} · Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={adjustmentTarget !== null}
        onClose={() => setAdjustmentTarget(null)}
        title="Registrar Ajuste de Stock"
        subtitle={adjustmentTarget ? `${adjustmentTarget.code} · ${adjustmentTarget.name}` : undefined}
        maxWidth="lg"
        variant="light"
      >
        <form onSubmit={onSubmitAdjustment} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            {(['POSITIVE', 'NEGATIVE'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAdjType(type)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold min-h-[44px] transition-all ${
                  adjType === type
                    ? type === 'POSITIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {type === 'POSITIVE' ? (
                  <PlusCircle className="w-4 h-4" />
                ) : (
                  <MinusCircle className="w-4 h-4" />
                )}
                <span>{type === 'POSITIVE' ? 'Entrada (+)' : 'Salida (−)'}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cantidad</label>
            <input
              type="number"
              min={1}
              max={99999}
              step={1}
              placeholder="Ej: 4"
              className={`${inputClass} ${adjustForm.formState.errors.quantity ? 'border-red-400' : ''}`}
              {...adjustForm.register('quantity', { valueAsNumber: true })}
            />
            {adjustForm.formState.errors.quantity && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                {adjustForm.formState.errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Razón del ajuste <span className="text-red-600">*</span> (mín. 10 caracteres)
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Conteo físico detectó 3 unidades adicionales tras inspección (RN-07)."
              className={`${inputClass} resize-none ${adjustForm.formState.errors.reason ? 'border-red-400' : ''}`}
              {...adjustForm.register('reason')}
            />
            {adjustForm.formState.errors.reason && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                {adjustForm.formState.errors.reason.message}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1 text-right">
              {(adjustForm.watch('reason') || '').length}/500
            </p>
          </div>

          {adjError && (
            <div className={errorClass}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{adjError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost-light" type="button" onClick={() => setAdjustmentTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant={adjType === 'POSITIVE' ? 'success' : 'danger'}
              type="submit"
              isLoading={adjustMutation.isPending}
            >
              Registrar Ajuste
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo Repuesto"
        subtitle="Se agrega al catálogo activo (huso de Jefe de Taller / Admin)."
        maxWidth="lg"
        variant="light"
      >
        <form onSubmit={onSubmitCreate} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Código</label>
              <input
                type="text"
                placeholder="Ej: REP-ELC-004"
                className={`${inputClass} ${createForm.formState.errors.code ? 'border-red-400' : ''}`}
                {...createForm.register('code')}
              />
              {createForm.formState.errors.code && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {createForm.formState.errors.code.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Bujía NGK BPR6ES"
                className={`${inputClass} ${createForm.formState.errors.name ? 'border-red-400' : ''}`}
                {...createForm.register('name')}
              />
              {createForm.formState.errors.name && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoría</label>
            <select
              className={inputClass}
              {...createForm.register('category')}
            >
              {SPARE_PART_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Precio unitario (BOB)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Ej: 45.00"
                className={`${inputClass} ${createForm.formState.errors.unitPrice ? 'border-red-400' : ''}`}
                {...createForm.register('unitPrice', { valueAsNumber: true })}
              />
              {createForm.formState.errors.unitPrice && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {createForm.formState.errors.unitPrice.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stock físico inicial</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Ej: 20"
                className={`${inputClass} ${createForm.formState.errors.initialStock ? 'border-red-400' : ''}`}
                {...createForm.register('initialStock', { valueAsNumber: true })}
              />
              {createForm.formState.errors.initialStock && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {createForm.formState.errors.initialStock.message}
                </p>
              )}
            </div>
          </div>

          {createError && (
            <div className={errorClass}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost-light" type="button" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              Crear Repuesto
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        title="Desactivar Repuesto"
        subtitle={deactivateTarget ? `${deactivateTarget.code} · ${deactivateTarget.name}` : undefined}
        maxWidth="md"
        variant="light"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              El repuesto dejará de estar disponible para nuevas cotizaciones y consultas del catálogo, pero
              conservará su historial y movimientos (RN-19).
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost-light" type="button" onClick={() => setDeactivateTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              type="button"
              leftIcon={<Trash2 className="w-4 h-4" />}
              isLoading={deactivateMutation.isPending}
              onClick={handleConfirmDeactivate}
            >
              Desactivar Repuesto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}