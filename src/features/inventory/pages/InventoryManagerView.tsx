import { useEffect, useState } from 'react';
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
} from 'lucide-react';

import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
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
  type InventoryAdjustmentType,
  type SparePart,
  type SparePartCategory,
  SPARE_PART_CATEGORIES,
} from '../spare-parts.types';

const CATEGORY_LABELS: Record<SparePartCategory, string> = {
  MOTOR: 'Motor',
  FRENOS: 'Frenos',
  SUSPENSION_DIRECCION: 'Suspensión / Dirección',
  TRANSMISION: 'Transmisión',
  FILTROS_FLUIDOS: 'Filtros y Fluidos',
  ELECTRICO_LUCES: 'Eléctrico / Luces',
  CLIMATIZACION: 'Climatización',
  CARROCERIA_ACCESORIOS: 'Carrocería y Accesorios',
};

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

const inputClass =
  'w-full px-4 py-2 rounded-xl border border-[#2D3139] bg-[#0F1115] text-[#E0E2E6] text-sm focus:outline-none focus:border-[#F97316] min-h-[44px]';

export function InventoryManagerView() {
  const { user } = useAuth();
  const toast = useToast();

  const canManage = user?.role === 'WORKSHOP_LEAD' || user?.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SparePartCategory | 'ALL'>('ALL');
  const [onlyOutOfStock, setOnlyOutOfStock] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 350);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const { data, isPending, isError, refetch } = useSpareParts({
    search: debouncedTerm || undefined,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    pageSize: 100,
  });

  const createMutation = useCreateSparePart();
  const adjustMutation = useRegisterAdjustment();
  const deactivateMutation = useDeactivateSparePart();

  const items: SparePart[] = data?.data ?? [];
  const totalItems = data?.total ?? items.length;
  const totalAvailable = items.reduce((sum, part) => sum + part.availableStock, 0);
  const totalReserved = items.reduce((sum, part) => sum + part.reservedStock, 0);
  const outOfStockCount = items.filter((part) => part.availableStock <= 0).length;
  const latestMovement = items.reduce<string | undefined>((latest, part) => {
    if (!part.lastMovementAt) return latest;
    return latest === undefined || part.lastMovementAt > latest ? part.lastMovementAt : latest;
  }, undefined);

  const [adjustmentTarget, setAdjustmentTarget] = useState<SparePart | null>(null);
  const [adjType, setAdjType] = useState<InventoryAdjustmentType>('POSITIVE');
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjError, setAdjError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<{
    code: string;
    name: string;
    category: SparePartCategory;
    unitPrice: string;
    initialStock: string;
  }>({ code: '', name: '', category: 'MOTOR', unitPrice: '', initialStock: '' });
  const [createError, setCreateError] = useState<string | null>(null);

  const resetAdjForm = () => {
    setAdjType('POSITIVE');
    setAdjQuantity('');
    setAdjReason('');
    setAdjError(null);
  };

  const resetCreateForm = () => {
    setCreateForm({ code: '', name: '', category: 'MOTOR', unitPrice: '', initialStock: '' });
    setCreateError(null);
  };

  const openAdjustment = (part: SparePart) => {
    resetAdjForm();
    setAdjustmentTarget(part);
  };

  const handleSubmitAdjustment = () => {
    if (!adjustmentTarget) return;
    const quantity = Number(adjQuantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setAdjError('La cantidad debe ser un número entero mayor o igual a 1 (máx. 99999).');
      return;
    }
    const reason = adjReason.trim();
    if (reason.length < 10 || reason.length > 500) {
      setAdjError('La razón debe tener entre 10 y 500 caracteres.');
      return;
    }
    setAdjError(null);
    adjustMutation.mutate(
      { sparePartId: adjustmentTarget.id, quantity, type: adjType, reason },
      {
        onSuccess: (response) => {
          toast.success(
            'Ajuste Registrado',
            `${adjustmentTarget.name}: stock físico ${response.previousPhysicalStock} → ${response.adjustedPhysicalStock}.`,
          );
          setAdjustmentTarget(null);
          resetAdjForm();
        },
        onError: (error) => {
          setAdjError(toApiMessage(error, 'No se pudo registrar el ajuste de stock.'));
        },
      },
    );
  };

  const handleSubmitCreate = () => {
    const code = createForm.code.trim();
    const name = createForm.name.trim();
    const unitPrice = Number(createForm.unitPrice);
    const initialStock = Number(createForm.initialStock);
    if (code.length < 3 || code.length > 30) {
      setCreateError('El código debe tener entre 3 y 30 caracteres.');
      return;
    }
    if (name.length < 3 || name.length > 120) {
      setCreateError('El nombre debe tener entre 3 y 120 caracteres.');
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setCreateError('Ingresa un precio unitario mayor a 0.');
      return;
    }
    if (!Number.isInteger(initialStock) || initialStock < 0) {
      setCreateError('El stock inicial debe ser un entero mayor o igual a 0.');
      return;
    }
    setCreateError(null);
    createMutation.mutate(
      { code, name, category: createForm.category, unitPrice, initialStock },
      {
        onSuccess: () => {
          toast.success('Repuesto Creado', `El repuesto "${name}" se agregó al catálogo.`);
          setShowCreate(false);
          resetCreateForm();
        },
        onError: (error) => {
          setCreateError(toApiMessage(error, 'No se pudo crear el repuesto.'));
        },
      },
    );
  };

  const handleDeactivate = (part: SparePart) => {
    if (!window.confirm(`¿Desactivar el repuesto "${part.name}" (${part.code})? Dejará de aparecer en el catálogo.`)) {
      return;
    }
    deactivateMutation.mutate(part.id, {
      onSuccess: () => {
        toast.success('Repuesto Desactivado', `${part.name} ya no estará disponible en el catálogo.`);
      },
      onError: (error) => {
        toast.danger('Error', toApiMessage(error, 'No se pudo desactivar el repuesto.'));
      },
    });
  };

  const visibleItems = onlyOutOfStock ? items.filter((part) => part.availableStock <= 0) : items;

  if (isPending) {
    return <LoadingSkeleton rows={6} />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-8 h-8 text-[#EF4444]" />}
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
            <div className="w-9 h-9 rounded-xl bg-[#F9731615] border border-[#F9731630] flex items-center justify-center text-[#F97316]">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Catálogo de Repuestos</h1>
          </div>
          <p className="text-xs text-[#8E949F] mt-1.5">
            Stock físico, disponible y reservado. Los ajustes de inventario se registran con trazabilidad (HU-14).
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              resetCreateForm();
              setShowCreate(true);
            }}
          >
            Nuevo Repuesto
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ítems en Catálogo"
          value={totalItems}
          subtitle={`${totalAvailable} unidades disponibles en taller`}
          icon={<Boxes className="w-5 h-5" />}
        />
        <MetricCard
          title="Unidades Reservadas"
          value={totalReserved}
          subtitle="Bloqueadas para OTs (RN-07)"
          icon={<Layers className="w-5 h-5" />}
        />
        <MetricCard
          title="Sin Stock"
          value={outOfStockCount}
          variant={outOfStockCount > 0 ? 'warning' : 'default'}
          subtitle="Disponible en 0"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <MetricCard
          title="Última Rotación"
          value={latestMovement ? daysSince(latestMovement) : 'N/D'}
          subtitle="Según último movimiento"
          icon={<Zap className="w-5 h-5" />}
        />
      </div>

      <Card variant="flat" padding="md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E949F]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ej: REP-MOT-001) o nombre..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#2D3139] bg-[#0F1115] text-[#E0E2E6] text-sm focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setOnlyOutOfStock(!onlyOutOfStock)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[44px] flex items-center gap-2 ${
                onlyOutOfStock
                  ? 'bg-[#F9731615] text-[#F97316] border-[#F9731630]'
                  : 'bg-[#1C2028] border-[#2D3139] text-[#8E949F] hover:text-[#E0E2E6]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span>Ver Solo Sin Stock</span>
            </button>

            <Button variant="ghost" size="sm" onClick={() => void refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
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
                ? 'bg-[#F97316] text-white border-[#F97316]'
                : 'bg-[#1C2028] border-[#2D3139] text-[#8E949F] hover:text-[#E0E2E6]'
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
                  ? 'bg-[#F97316] text-white border-[#F97316]'
                  : 'bg-[#1C2028] border-[#2D3139] text-[#8E949F] hover:text-[#E0E2E6]'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </Card>

      {visibleItems.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No se encontraron repuestos"
          description="Ajusta la búsqueda, el filtro de categoría o el filtro de stock para encontrar resultados."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((part) => {
            const isOutOfStock = part.availableStock <= 0;
            return (
              <Card
                key={part.id}
                variant={isOutOfStock ? 'danger' : 'default'}
                padding="md"
                className="flex flex-col justify-between space-y-4 hover:border-[#2D3139] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#2D3139]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#F97316] bg-[#F9731615] px-2 py-0.5 rounded border border-[#F9731630]">
                          {part.code}
                        </span>
                        <Badge variant="slate" size="sm">
                          {CATEGORY_LABELS[part.category]}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-white mt-1.5 line-clamp-1">{part.name}</h3>
                    </div>
                    <Badge variant={part.isActive ? 'success' : 'warning'}>{part.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>

                  <div className="py-2.5 space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#1C2028] border border-[#2D3139] text-center font-mono">
                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">Físico</span>
                        <span className="text-base font-extrabold text-white">{part.physicalStock}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">Disponible</span>
                        <span className={`text-base font-extrabold ${isOutOfStock ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                          {part.availableStock}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">Reservado</span>
                        <span className="text-base font-extrabold text-[#F97316]">{part.reservedStock}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-semibold pt-1">
                      <span className="text-[#8E949F]">Precio oficial (BOB)</span>
                      <span className="text-sm font-mono font-extrabold text-white">{formatCurrency(part.unitPrice)}</span>
                    </div>

                    <div className="flex items-center justify-between font-semibold pt-1">
                      <span className="text-[#8E949F]">Último movimiento</span>
                      <span className="text-sm font-medium text-[#E0E2E6]">{daysSince(part.lastMovementAt)}</span>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#2D3139]">
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
                      onClick={() => handleDeactivate(part)}
                      title="Desactivar repuesto"
                      className="flex justify-center"
                    >
                      Desactivar
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={adjustmentTarget !== null}
        onClose={() => setAdjustmentTarget(null)}
        title="Registrar Ajuste de Stock"
        subtitle={adjustmentTarget ? `${adjustmentTarget.code} · ${adjustmentTarget.name}` : undefined}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['POSITIVE', 'NEGATIVE'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAdjType(type)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold min-h-[44px] transition-all ${
                  adjType === type
                    ? type === 'POSITIVE'
                      ? 'bg-[#22C55E15] text-[#22C55E] border-[#22C55E50]'
                      : 'bg-[#EF444415] text-[#EF4444] border-[#EF444450]'
                    : 'bg-[#1C2028] border-[#2D3139] text-[#8E949F] hover:text-[#E0E2E6]'
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
            <label className="block text-xs font-semibold text-[#8E949F] mb-1.5">Cantidad</label>
            <input
              type="number"
              min={1}
              max={99999}
              step={1}
              value={adjQuantity}
              onChange={(e) => setAdjQuantity(e.target.value)}
              placeholder="Ej: 4"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E949F] mb-1.5">
              Razón del ajuste <span className="text-[#EF4444]">*</span> (mín. 10 caracteres)
            </label>
            <textarea
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              rows={3}
              placeholder="Ej: Conteo físico detectó 3 unidades adicionales tras inspección (RN-07)."
              className={`${inputClass} resize-none`}
            />
            <p className="text-[10px] text-[#8E949F] mt-1 text-right">{(adjReason || '').length}/500</p>
          </div>

          {adjError && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-[#EF444430] bg-[#EF444415] text-xs text-[#F87171]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{adjError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAdjustmentTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant={adjType === 'POSITIVE' ? 'success' : 'danger'}
              onClick={handleSubmitAdjustment}
              isLoading={adjustMutation.isPending}
            >
              Registrar Ajuste
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo Repuesto"
        subtitle="Se agrega al catálogo activo (huso de Jefe de Taller / Admin)."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8E949F] mb-1.5">Código</label>
              <input
                type="text"
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                placeholder="Ej: REP-ELC-004"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8E949F] mb-1.5">Nombre</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ej: Bujía NGK BPR6ES"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E949F] mb-1.5">Categoría</label>
            <select
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as SparePartCategory })}
              className={inputClass}
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
              <label className="block text-xs font-semibold text-[#8E949F] mb-1.5">Precio unitario (BOB)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={createForm.unitPrice}
                onChange={(e) => setCreateForm({ ...createForm, unitPrice: e.target.value })}
                placeholder="Ej: 45.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8E949F] mb-1.5">Stock físico inicial</label>
              <input
                type="number"
                min={0}
                step={1}
                value={createForm.initialStock}
                onChange={(e) => setCreateForm({ ...createForm, initialStock: e.target.value })}
                placeholder="Ej: 20"
                className={inputClass}
              />
            </div>
          </div>

          {createError && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-[#EF444430] bg-[#EF444415] text-xs text-[#F87171]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmitCreate} isLoading={createMutation.isPending}>
              Crear Repuesto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}