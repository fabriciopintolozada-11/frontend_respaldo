import { Clock, ArrowRight } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { WorkOrderStatusBadge } from '@/features/work-orders/components/WorkOrderStatusBadge'
import type { AssignedWorkOrderSummary } from '@/shared/types/work-order'

interface AssignedOrderCardProps {
  order: AssignedWorkOrderSummary
  onSelect: (id: string) => void
}

export function AssignedOrderCard({ order, onSelect }: AssignedOrderCardProps) {
  return (
    <div
      className="hover:border-primary cursor-pointer transition-all group"
      onClick={() => onSelect(order.id)}
    >
    <Card
      padding="md"
      className="h-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Order info */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-primary bg-primary/15 border border-primary/30 px-2.5 py-0.5 rounded-lg">
              {order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="font-mono font-extrabold text-base text-foreground">
              {order.plate}
            </span>
            <WorkOrderStatusBadge status={order.status} />
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 italic">
            Motivo: &quot;{order.initialComplaint}&quot;
          </p>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Asignado: {order.assignedAt
                ? new Date(order.assignedAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Sin fecha'}
            </span>
          </div>
        </div>

        {/* Right: Action */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            Ver Detalle
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
    </div>
  )
}
