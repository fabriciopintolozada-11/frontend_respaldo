import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  PlusCircle,
  RefreshCw,
  Boxes,
} from 'lucide-react';

import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { RotationBadge } from '../../../shared/components/Badge';
import { MetricCard } from '../../../shared/components/MetricCard';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useToast } from '../../../shared/components/ToastContext';
import { ApiError } from '../../../shared/api/httpClient';

import {
  productsService,
  type InventoryStats,
} from '../api/products-service';
import { InventoryAdjustmentModal } from '../components/InventoryAdjustmentModal';
import { useInventoryAdjustment } from '../hooks/useInventoryAdjustment';

import type {
  InventoryItem,
  PartCategory,
} from '../../../shared/types/openapi';
import type { CreateInventoryAdjustmentPayload } from '../api/inventory-adjustments-api';

const CATEGORIES: { key: PartCategory | 'TODAS'; label: string }[] = [
  { key: 'TODAS', label: 'Todas las Categorías' },
  { key: 'MOTOR', label: 'Motor' },
  { key: 'FRENOS', label: 'Frenos' },
  {
    key: 'SUSPENSION_DIRECCION',
    label: 'Suspensión & Dirección',
  },
  { key: 'TRANSMISION', label: 'Transmisión & Embragues' },
  { key: 'FILTROS_FLUIDOS', label: 'Filtros & Fluidos' },
  {
    key: 'ELECTRICO_LUCES',
    label: 'Eléctrico & Iluminación',
  },
  { key: 'CLIMATIZACION', label: 'Climatización / A/C' },
  {
    key: 'CARROCERIA_ACCESORIOS',
    label: 'Carrocería & Accesorios',
  },
];

const ADJUSTMENT_TYPES: { value: string; label: string }[] = [];

export const InventoryManagerView: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const inventoryAdjustment = useInventoryAdjustment();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
  });

  const statsQuery = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsService.getStats(),
  });

  const items: InventoryItem[] = productsQuery.data?.data ?? [];
  const stats: InventoryStats | null = statsQuery.data?.data ?? null;

  const [selectedCategory, setSelectedCategory] =
    useState<PartCategory | 'TODAS'>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyAlertsFilter, setOnlyAlertsFilter] = useState(false);

  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] =
    useState<PartCategory>('MOTOR');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemModels, setNewItemModels] = useState('');
  const [newItemStock, setNewItemStock] = useState(10);
  const [newItemMinStock, setNewItemMinStock] = useState(2);
  const [newItemCost, setNewItemCost] = useState(100);
  const [newItemPrice, setNewItemPrice] = useState(160);
  const [newItemShelf, setNewItemShelf] = useState('Estante A-01');

  const [selectedItemForAdjustment, setSelectedItemForAdjustment] =
    useState<InventoryItem | null>(null);

  const isLoading = productsQuery.isPending || statsQuery.isPending;
  const hasError = productsQuery.isError || statsQuery.isError;

  const reloadData = () => {
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'TODAS' ||
      item.category === selectedCategory;

    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.compatibleModels
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesAlerts =
      !onlyAlertsFilter ||
      item.daysWithoutMovement >= 60 ||
      item.stockAvailable <= item.stockMinimum;

    return matchesCategory && matchesSearch && matchesAlerts;
  });

  const handleCreateItem = async () => {
    if (!newItemCode || !newItemName || !newItemBrand) {
      toast.warning('Complete los campos obligatorios');
      return;
    }

    try {
      await productsService.registerProduct({
        code: newItemCode.toUpperCase(),
        name: newItemName,
        category: newItemCategory,
        brand: newItemBrand,
        compatibleModels: newItemModels || 'Universal',
        stockAvailable: Number(newItemStock) || 0,
        stockMinimum: Number(newItemMinStock) || 1,
        unitCostBOB: Number(newItemCost) || 0,
        unitPriceBOB: Number(newItemPrice) || 0,
        locationShelf: newItemShelf,
        rotationCategory: 'MEDIA',
      });

      toast.success(
        'Repuesto Registrado',
        `${newItemName} agregado al inventario.`,
      );

      setIsNewItemModalOpen(false);

      await queryClient.invalidateQueries({
        queryKey: ['products'],
      });
    } catch {
      toast.danger('Error al registrar repuesto');
    }
  };

  const handleInventoryAdjustment = async (
    payload: CreateInventoryAdjustmentPayload,
  ) => {
    try {
      await inventoryAdjustment.mutateAsync(payload);

      toast.success(
        'Ajuste registrado',
        'El ajuste físico de inventario fue registrado correctamente.',
      );

      setSelectedItemForAdjustment(null);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 422) {
          toast.danger(
            'Ajuste rechazado',
            'El ajuste produciría un saldo inválido o afectaría las reservas existentes.',
          );
          return;
        }

        if (error.statusCode === 403) {
          toast.danger(
            'Acceso denegado',
            'Solo Jefatura de Taller o Administración pueden registrar ajustes.',
          );
          return;
        }
      }

      toast.danger(
        'No se pudo registrar el ajuste',
        'Intenta nuevamente.',
      );
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (hasError) {
    return (
      <EmptyState
        icon={
          <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
        }
        title="No se pudo conectar con el catálogo"
        description="Verifica la conexión con el backend y vuelve a intentar la consulta de repuestos."
        actionLabel="Reintentar"
        onAction={reloadData}
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

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Inventario de Repuestos & Insumos
            </h1>
          </div>

          <p className="text-xs text-[#8E949F] mt-1.5">
            Control de rotación, reservas para OTs (RN-07,
            RN-08) y alertas por inactividad de 2+ meses
            (RN-10).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsNewItemModalOpen(true)}
          >
            Nuevo Repuesto
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Ítems en Catálogo"
            value={stats.totalItems}
            subtitle={`${stats.totalUnitsAvailable} unidades físicas en taller`}
            icon={<Boxes className="w-5 h-5" />}
          />

          <MetricCard
            title="Unidades Reservadas"
            value={stats.totalUnitsReserved}
            subtitle="Bloqueadas para OTs en bahía (RN-07)"
            icon={<Layers className="w-5 h-5" />}
          />

          <MetricCard
            title="Alertas Sin Rotación"
            value={stats.noRotationAlertCount}
            subtitle=">60 días sin movimiento (RN-10)"
            variant={
              stats.noRotationAlertCount > 0
                ? 'warning'
                : 'default'
            }
            icon={<AlertTriangle className="w-5 h-5" />}
          />

          <MetricCard
            title="Valor del Inventario"
            value={`${stats.totalStockValueBOB.toLocaleString(
              'es-BO',
            )} Bs.`}
            subtitle="Costo total en almacén"
            icon={<ArrowUpDown className="w-5 h-5" />}
          />
        </div>
      )}

      {stats && stats.noRotationAlertCount > 0 && (
        <div className="p-4 rounded-2xl bg-[#F59E0B10] border border-[#F59E0B30] text-[#E0E2E6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-10 bg-[#F59E0B] rounded-full shrink-0 mt-0.5" />

            <div>
              <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span className="text-[#F59E0B]">
                  ALERTA DE ROTACIÓN (RN-10):
                </span>{' '}
                {stats.noRotationAlertCount} repuestos sin
                movimiento
              </h4>

              <p className="text-xs text-[#8E949F] mt-0.5">
                Existen repuestos con más de 2 meses (60+
                días) sin movimiento. Se recomienda planificar
                promociones o devolución al proveedor.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOnlyAlertsFilter(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white transition-all whitespace-nowrap"
          >
            Filtrar Inactivos (RN-10)
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[38px] ${
                isSelected
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'bg-[#16191F] border border-[#2D3139] text-[#8E949F] hover:text-[#E0E2E6] hover:bg-[#1C2028]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <Card variant="flat" padding="md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E949F]" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Buscar por código (ej: REP-MOT-001), nombre, marca o modelo compatible..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#2D3139] bg-[#0F1115] text-[#E0E2E6] text-sm focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setOnlyAlertsFilter(!onlyAlertsFilter)
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[44px] flex items-center gap-2 ${
                onlyAlertsFilter
                  ? 'bg-[#F9731615] text-[#F97316] border-[#F9731630]'
                  : 'bg-[#1C2028] border-[#2D3139] text-[#8E949F] hover:text-[#E0E2E6]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span>
                Ver Solo Alertas (RN-10 / Stock Bajo)
              </span>
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={reloadData}
              leftIcon={
                <RefreshCw className="w-4 h-4" />
              }
            >
              Refrescar
            </Button>
          </div>
        </div>
      </Card>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No se encontraron repuestos"
          description="Ajusta los filtros de categoría o registra un nuevo código en el catálogo."
          actionLabel="Registrar Repuesto"
          onAction={() => setIsNewItemModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const hasRN10 =
              item.daysWithoutMovement >= 60 ||
              item.rotationCategory ===
                'SIN_ROTACION_ALERTA';

            const isLowStock =
              item.stockAvailable <= item.stockMinimum;

            return (
              <Card
                key={item.id}
                variant={
                  hasRN10
                    ? 'warning'
                    : isLowStock
                      ? 'danger'
                      : 'default'
                }
                padding="md"
                className="flex flex-col justify-between space-y-4 hover:border-[#2D3139] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#2D3139]">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#F97316] bg-[#F9731615] px-2 py-0.5 rounded border border-[#F9731630]">
                        {item.code}
                      </span>

                      <h3 className="font-bold text-sm text-white mt-1 line-clamp-1">
                        {item.name}
                      </h3>

                      <p className="text-xs text-[#8E949F] font-medium">
                        Marca: {item.brand}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1C2028] text-[#8E949F] border border-[#2D3139]">
                      {item.locationShelf}
                    </span>
                  </div>

                  <div className="py-2.5 space-y-2.5 text-xs">
                    <p className="text-[#8E949F]">
                      <strong className="text-[#E0E2E6]">
                        Compatibilidad:
                      </strong>{' '}
                      {item.compatibleModels}
                    </p>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#1C2028] border border-[#2D3139] text-center font-mono">
                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">
                          Disponible
                        </span>

                        <span
                          className={`text-base font-extrabold ${
                            isLowStock
                              ? 'text-[#EF4444]'
                              : 'text-[#22C55E]'
                          }`}
                        >
                          {item.stockAvailable}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">
                          Reservado
                        </span>

                        <span className="text-base font-extrabold text-[#F97316]">
                          {item.stockReserved}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">
                          Mínimo
                        </span>

                        <span className="text-base font-bold text-[#8E949F]">
                          {item.stockMinimum}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold pt-1">
                      <span className="text-[#8E949F]">
                        Costo: {item.unitCostBOB} Bs.
                      </span>

                      <span className="text-sm font-mono font-extrabold text-white">
                        PVP: {item.unitPriceBOB} BOB
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#2D3139] flex items-center justify-between">
                      <RotationBadge
                        rotation={item.rotationCategory}
                      />

                      <span className="text-[11px] text-[#8E949F] font-mono">
                        {item.daysWithoutMovement} días sin
                        mov.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2D3139] flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedItemForAdjustment(item)
                    }
                    className="w-full text-xs"
                  >
                    Registrar ajuste físico
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <InventoryAdjustmentModal
        isOpen={selectedItemForAdjustment !== null}
        sparePartId={
          selectedItemForAdjustment?.id ?? null
        }
        sparePartLabel={
          selectedItemForAdjustment
            ? `${selectedItemForAdjustment.code} - ${selectedItemForAdjustment.name}`
            : ''
        }
        adjustmentTypes={ADJUSTMENT_TYPES}
        isPending={inventoryAdjustment.isPending}
        onClose={() =>
          setSelectedItemForAdjustment(null)
        }
        onSubmit={handleInventoryAdjustment}
      />

      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="Registrar Nuevo Repuesto en Catálogo"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Código Único (SKU)"
                value={newItemCode}
                onChange={(event) =>
                  setNewItemCode(
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="Ej: REP-MOT-006"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E949F] uppercase tracking-wider mb-1.5">
                Categoría
              </label>

              <select
                value={newItemCategory}
                onChange={(event) =>
                  setNewItemCategory(
                    event.target.value as PartCategory,
                  )
                }
                className="w-full rounded-xl border border-[#2D3139] bg-[#0F1115] text-[#E0E2E6] px-3.5 py-2.5 text-sm min-h-[44px] focus:outline-none focus:border-[#F97316]"
              >
                <option value="MOTOR">Motor</option>
                <option value="FRENOS">Frenos</option>
                <option value="SUSPENSION_DIRECCION">
                  Suspensión y Dirección
                </option>
                <option value="TRANSMISION">
                  Transmisión
                </option>
                <option value="FILTROS_FLUIDOS">
                  Filtros y Fluidos
                </option>
                <option value="ELECTRICO_LUCES">
                  Eléctrico y Luces
                </option>
                <option value="CLIMATIZACION">
                  Climatización
                </option>
                <option value="CARROCERIA_ACCESORIOS">
                  Carrocería y Accesorios
                </option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Nombre Descriptivo del Repuesto"
                value={newItemName}
                onChange={(event) =>
                  setNewItemName(event.target.value)
                }
                placeholder="Ej: Kit de Distribución + Bomba de Agua"
                required
              />
            </div>

            <div>
              <Input
                label="Marca Fabricante"
                value={newItemBrand}
                onChange={(event) =>
                  setNewItemBrand(event.target.value)
                }
                placeholder="Ej: Gates, Bosch, Mann"
                required
              />
            </div>

            <div>
              <Input
                label="Modelos Compatibles"
                value={newItemModels}
                onChange={(event) =>
                  setNewItemModels(event.target.value)
                }
                placeholder="Ej: Toyota Hilux 2.8, Fortuner"
              />
            </div>

            <div>
              <Input
                label="Stock Inicial Disponible"
                type="number"
                value={newItemStock}
                onChange={(event) =>
                  setNewItemStock(
                    Number(event.target.value),
                  )
                }
                min={0}
                required
              />
            </div>

            <div>
              <Input
                label="Stock Mínimo de Alerta"
                type="number"
                value={newItemMinStock}
                onChange={(event) =>
                  setNewItemMinStock(
                    Number(event.target.value),
                  )
                }
                min={1}
                required
              />
            </div>

            <div>
              <Input
                label="Costo Unitario (BOB)"
                type="number"
                value={newItemCost}
                onChange={(event) =>
                  setNewItemCost(
                    Number(event.target.value),
                  )
                }
                min={0}
                required
              />
            </div>

            <div>
              <Input
                label="Precio Venta Público (BOB)"
                type="number"
                value={newItemPrice}
                onChange={(event) =>
                  setNewItemPrice(
                    Number(event.target.value),
                  )
                }
                min={0}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Ubicación Física en Taller"
                value={newItemShelf}
                onChange={(event) =>
                  setNewItemShelf(event.target.value)
                }
                placeholder="Ej: Estante B-04 / Gaveta 2"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-[#2D3139]">
            <Button
              variant="outline"
              onClick={() =>
                setIsNewItemModalOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              onClick={handleCreateItem}
            >
              Guardar Repuesto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};