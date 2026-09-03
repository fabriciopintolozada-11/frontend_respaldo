import { useNavigate } from 'react-router';
import { ArrowRight, FileText, Search } from 'lucide-react';

import { Card } from '../../shared/components/Card';
import { Badge, WorkOrderStatusBadge } from '../../shared/components/Badge';
import { Input } from '../../shared/components/Input';
import { EmptyState } from '../../shared/components/EmptyState';
import { useWorkshop } from '../../state/WorkshopContext';
import { useState } from 'react';

export function WorkOrdersListView() {
  const navigate = useNavigate();
  const { workOrders, mechanics } = useWorkshop();
  const [query, setQuery] = useState('');

  const filtered = workOrders.filter((ot) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      ot.code.toLowerCase().includes(q) ||
      ot.vehiclePlate.toLowerCase().includes(q) ||
      ot.clientName.toLowerCase().includes(q) ||
      ot.vehicleModel.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F9731615] border border-[#F9731630] flex items-center justify-center text-[#F97316]">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Órdenes de Trabajo</h1>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Todas las OTs del taller con su estado, bahía y mecánico asignado.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, placa, cliente o modelo..."
            leftIcon={<Search className="w-4 h-4" />}
            aria-label="Buscar órdenes de trabajo"
            tone="light"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-slate-400" />}
          title="Sin resultados"
          description="No se encontraron órdenes de trabajo para la búsqueda actual."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((ot) => {
            const primaryMech = mechanics.find((m) => m.id === ot.primaryMechanicId);
            return (
              <Card
                key={ot.id}
                padding="md"
                className="!bg-white !text-slate-900 !border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-orange-300 transition-colors"
                onClick={() => navigate(`/ots/${ot.id}`)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#F97316] bg-[#F9731615] border border-[#F9731630] px-2 py-0.5 rounded-lg">
                      {ot.code}
                    </span>
                    <span className="font-mono font-extrabold text-base text-slate-900">{ot.vehiclePlate}</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {ot.vehicleBrand} {ot.vehicleModel} ({ot.vehicleYear})
                    </span>
                    <WorkOrderStatusBadge status={ot.status} size="sm" className="!bg-slate-100 !text-slate-700 !border-slate-200" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1 truncate">
                    {ot.clientName} · {ot.entryReason}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {ot.assignedBayId && (
                    <Badge variant="purple" size="sm" className="!bg-purple-50 !text-purple-700 !border-purple-200">
                      Bahía #{ot.assignedBayId}
                    </Badge>
                  )}
                  {primaryMech && (
                    <Badge variant="slate" size="sm" className="!bg-slate-100 !text-slate-700 !border-slate-200">
                      {primaryMech.nickname}
                    </Badge>
                  )}
                  <Badge variant="default" size="sm" className="!bg-blue-50 !text-blue-700 !border-blue-200">
                    {ot.totalGeneralBOB.toLocaleString('es-BO')} BOB
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
