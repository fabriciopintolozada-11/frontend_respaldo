import { Badge } from '@/shared/components/Badge'
import type { WorkOrderStatus } from '@/shared/types/work-order'

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'danger' | 'warning' }> = {
  RECIBIDO: { label: 'Recibido', variant: 'default' },
  ASIGNADA: { label: 'Asignada', variant: 'primary' },
  EN_REPARACION: { label: 'En Reparacion', variant: 'primary' },
  ESPERANDO_REPUESTO: { label: 'Espera Repuesto', variant: 'warning' },
  FINALIZADO: { label: 'Finalizado', variant: 'success' },
  LISTO_ENTREGA: { label: 'Listo para Entrega', variant: 'success' },
}

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus
  size?: 'sm' | 'md' | 'lg'
}

export function WorkOrderStatusBadge({ status, size = 'md' }: WorkOrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.RECIBIDO
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  )
}
