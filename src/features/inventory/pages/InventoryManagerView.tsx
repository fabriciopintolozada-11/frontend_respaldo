import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
  AlertTriangle,
  Layers,
  Boxes,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { MetricCard } from '../../../shared/components/MetricCard';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { productsService, type SparePart } from '../api/products-service';

export const InventoryManagerView: React.FC = () => {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
  });
  const statsQuery = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsService.getStats(),
  });
  const items: SparePart[] = productsQuery.data?.data ?? [];
  const stats = statsQuery.data?.data ?? null;
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyOutOfStockFilter, setOnlyOutOfStockFilter] = useState(false);

  const isLoading = productsQuery.isPending || statsQuery.isPending;
  const hasError = productsQuery.isError || statsQuery.isError;
  const reloadData = () => {
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = !onlyOutOfStockFilter || item.availableStock <= 0;
    return matchesSearch && matchesStock;
  });

  if (isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (hasError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-8 h-8 text-[#EF4444]" />}
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
              Catálogo de Repuestos
            </h1>
          </div>
          <p className="text-xs text-[#8E949F] mt-1.5">
            Precios oficiales y stock disponible para la elaboración de presupuestos (HU-12).
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Ítems en Catálogo"
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
            title="Activos"
            value={stats.activeCount}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <MetricCard
            title="Inactivos"
            value={stats.inactiveCount}
            variant={stats.inactiveCount > 0 ? 'warning' : 'default'}
            icon={<XCircle className="w-5 h-5" />}
          />
        </div>
      )}

      <Card variant="flat" padding="md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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
              onClick={() => setOnlyOutOfStockFilter(!onlyOutOfStockFilter)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all min-h-[44px] flex items-center gap-2 ${
                onlyOutOfStockFilter
                  ? 'bg-[#F9731615] text-[#F97316] border-[#F9731630]'
                  : 'bg-[#1C2028] border-[#2D3139] text-[#8E949F] hover:text-[#E0E2E6]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <span>Ver Solo Sin Stock</span>
            </button>

            <Button variant="ghost" size="sm" onClick={reloadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Refrescar
            </Button>
          </div>
        </div>
      </Card>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No se encontraron repuestos"
          description="Ajusta el filtro de búsqueda o conéctate al backend para cargar el catálogo."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isOutOfStock = item.availableStock <= 0;
            return (
              <Card
                key={item.id}
                variant={isOutOfStock ? 'danger' : 'default'}
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
                    </div>
                    <Badge variant={item.isActive ? 'success' : 'warning'}>{item.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>

                  <div className="py-2.5 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#1C2028] border border-[#2D3139] text-center font-mono">
                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">Disponible</span>
                        <span className={`text-base font-extrabold ${isOutOfStock ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                          {item.availableStock}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8E949F] block uppercase">Reservado</span>
                        <span className="text-base font-extrabold text-[#F97316]">{item.reservedStock}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold pt-1">
                      <span className="text-[#8E949F]">Precio oficial (BOB)</span>
                      <span className="text-sm font-mono font-extrabold text-white">
                        {Number(item.unitPrice).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};