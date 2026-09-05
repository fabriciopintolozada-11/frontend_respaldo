import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BellRing,
  Boxes,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';

import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { MetricCard } from '../../../shared/components/MetricCard';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useInventoryAlerts } from '../api/inventory-alerts-service';
import {
  type InventoryAlert,
  type InventoryAlertType,
  INVENTORY_ALERT_LABELS,
} from '../inventory-alerts.types';
import {
  type SparePartCategory,
  CATEGORY_LABELS,
  SPARE_PART_CATEGORIES,
} from '../spare-parts.types';

const PAGE_SIZE = 20;

const ALERT_TYPE_FILTERS: Array<{ value: InventoryAlertType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'NO_ROTATION', label: 'Sin Rotación' },
  { value: 'STOCK_OUT', label: 'Stock Crítico' },
];

const ALERT_BADGE_VARIANT: Record<InventoryAlertType, 'danger' | 'warning'> = {
  STOCK_OUT: 'danger',
  NO_ROTATION: 'warning',
};

function daysSince(dateString?: string | null): string {
  if (!dateString) {
    return 'Sin movimientos';
  }
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / 86_400_000);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  return `Hace ${days} días`;
}

function missingEstimate(part: InventoryAlert): number {
  return Math.max(0, part.reservedStock - part.physicalStock);
}

export function InventoryAlertsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState<InventoryAlertType | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<SparePartCategory | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const { data, isPending, isError, refetch } = useInventoryAlerts({
    alertType: alertTypeFilter === 'ALL' ? undefined : alertTypeFilter,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    search: debouncedTerm || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const alerts: InventoryAlert[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.pageSize ?? PAGE_SIZE)));

  const noRotationCount = alerts.filter((alert) => alert.alertType === 'NO_ROTATION').length;
  const stockOutCount = alerts.filter((alert) => alert.alertType === 'STOCK_OUT').length;

  const resetToFirstPage = () => setPage(1);

  const handleTypeFilter = (value: InventoryAlertType | 'ALL') => {
    setAlertTypeFilter(value);
    resetToFirstPage();
  };

  const handleCategoryFilter = (value: SparePartCategory | 'ALL') => {
    setCategoryFilter(value);
    resetToFirstPage();
  };

  if (isPending) {
    return <LoadingSkeleton rows={6} tone="light" />;
  }

  if (isError) {
    return (
      <EmptyState
        tone="light"
        icon={<AlertTriangle className="w-8 h-8 text-red-600" />}
        title="No se pudieron cargar las alertas"
        description="Verifica la conexión con el backend y vuelve a intentar la consulta de alertas de inventario."
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
              <BellRing className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Alertas de Inventario</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Repuestos sin rotación por 60 días o más (RN-10) y disponibilidad crítica por reservas.
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={() => void refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Alertas Activas"
          value={total}
          subtitle={`${data?.total ?? 0} repuestos con alerta`}
          icon={<BellRing className="w-5 h-5" />}
          theme="light"
        />
        <MetricCard
          title="Sin Rotación"
          value={noRotationCount}
          variant={noRotationCount > 0 ? 'warning' : 'default'}
          subtitle="60+ días sin salida o consumo"
          icon={<Boxes className="w-5 h-5" />}
          theme="light"
        />
        <MetricCard
          title="Stock Crítico"
          value={stockOutCount}
          variant={stockOutCount > 0 ? 'danger' : 'default'}
          subtitle="Disponible menor o igual a 0"
          icon={<AlertTriangle className="w-5 h-5" />}
          theme="light"
        />
      </div>

      <Card variant="public" padding="md">
        <Input
          tone="light"
          leftIcon={<Search className="w-4 h-4" />}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            resetToFirstPage();
          }}
          placeholder="Buscar por código (ej: REP-MOT-001) o nombre..."
        />

        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {ALERT_TYPE_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeFilter(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border min-h-[36px] whitespace-nowrap transition-all ${
                alertTypeFilter === option.value
                  ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-sm shadow-lime-950/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border min-h-[36px] whitespace-nowrap transition-all ${
              categoryFilter === 'ALL'
                ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-sm shadow-lime-950/10'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Todas las categorías
          </button>
          {SPARE_PART_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryFilter(category)}
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

      {alerts.length === 0 ? (
        <EmptyState
          tone="light"
          icon={<Package className="w-8 h-8" />}
          title="Sin alertas de inventario"
          description="No se registran alertas de inventario ni repuestos estancados."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.partId}
                className={`rounded-2xl bg-white border p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm ${
                  alert.alertType === 'STOCK_OUT' ? 'border-red-300' : 'border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-lime-800 bg-lime-50 px-2 py-0.5 rounded border border-lime-200">
                          {alert.code}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {CATEGORY_LABELS[alert.category]}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-950 mt-1.5 line-clamp-1">{alert.name}</h3>
                    </div>
                    <Badge variant={ALERT_BADGE_VARIANT[alert.alertType]} dot>
                      {INVENTORY_ALERT_LABELS[alert.alertType]}
                    </Badge>
                  </div>

                  <div className="py-2.5 space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Físico</span>
                        <span className="text-base font-extrabold text-slate-900">{alert.physicalStock}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Disponible</span>
                        <span className={`text-base font-extrabold ${alert.availableStock <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {alert.availableStock}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Reservado</span>
                        <span className="text-base font-extrabold text-lime-700">{alert.reservedStock}</span>
                      </div>
                    </div>

                    {alert.alertType === 'STOCK_OUT' && (
                      <div className="flex items-center justify-between font-semibold pt-1">
                        <span className="text-slate-500">Faltante estimado</span>
                        <span className="text-sm font-mono font-extrabold text-red-600">{missingEstimate(alert)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-semibold pt-1">
                      <span className="text-slate-500">Días sin movimiento</span>
                      <span className="text-sm font-medium text-slate-900">{alert.daysWithoutMovement} días</span>
                    </div>

                    <div className="flex items-center justify-between font-semibold pt-1">
                      <span className="text-slate-500">Último movimiento</span>
                      <span className="text-sm font-medium text-slate-900">{daysSince(alert.lastMovementAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs font-semibold text-slate-600">
              {total} {total === 1 ? 'alerta' : 'alertas'} · Página {page} de {totalPages}
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
    </div>
  );
}